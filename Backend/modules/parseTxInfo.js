const { decodeTxRaw } = require('@cosmjs/proto-signing');
const { SigningStargateClient, StargateClient } = require('@cosmjs/stargate');
const { toHex } = require("@cosmjs/encoding");
const { sha256 } = require("@cosmjs/crypto");
const env = process.env;
const axios = require('axios');
const { Block } = require('../models');
const { Op } = require("sequelize");
require("dotenv").config();


async function extractTxInfo(data) {
    const signingClient = await SigningStargateClient.connect(env.END_POINT);
    const txData = typeof data === "string" ? JSON.parse(data) : data;
    if (txData.result) { // from axios get (query: txHash)
        const { result: { hash, height, tx_result: { gas_wanted: gasWanted, gas_used: gasUsed } } } = txData;
        const block = await axios.get(env.END_POINT + "block?height=" + String(height));
        if (!block || !block.data.result) return null;
        const blockData = block.data;
        const { result: { block: { header: { chain_id: chainId, time }, data: { txs } } } } = blockData;
        const txHashes = txs.map(tx => toHex(sha256(Buffer.from(tx, 'base64'))));
        let fee;
        for (let i = 0; i < txHashes.length; ++i) {
            const txHash = String(txHashes[i]).toUpperCase();
            if (txHash === hash) {
                const txFromHash = await signingClient.getTx(txHash);
                if (!txFromHash) return null;
                const txRaw = txFromHash.tx;
                const txInfoAfterSigned = decodeTxRaw(txRaw);
                fee = getFeeFromDecodedTx(txInfoAfterSigned);
                const { body: { messages, memo } } = txInfoAfterSigned;
                const decodedMessages = messages.map(msg => {
                    const decoder = new TextDecoder();
                    const value = decoder.decode(msg.value);
                    const decodedMessage = {
                        typeUrl: msg.typeUrl,
                        value
                    }
                    return decodedMessage;
                });
                const res = { // type : send / get reward / delegate / etc
                    chainId,
                    hash,
                    type: "TBD",
                    status: "TBD",
                    height,
                    time,
                    fee,
                    gas: { gasUsed, gasWanted },
                    memo,
                    messages: decodedMessages
                }
                return res;
            }
        }
        return null;
    } else if (txData.height) { // from signing client method
        const { hash, height, gasUsed, gasWanted } = txData;
        const block = await axios.get(env.END_POINT + "block?height=" + String(height));
        if (!block || !block.data.result) return null;
        const blockData = block.data;
        const { result: { block: { header: { chain_id: chainId, time }, data: { txs } } } } = blockData;
        const txHashes = txs.map(tx => toHex(sha256(Buffer.from(tx, 'base64'))));
        let fee;
        for (let i = 0; i < txHashes.length; ++i) {
            const txHash = String(txHashes[i]).toUpperCase();
            if (txHash === hash) {
                const txFromHash = await signingClient.getTx(txHash);
                if (!txFromHash) return null;
                const txRaw = txFromHash.tx;
                const txInfoAfterSigned = decodeTxRaw(txRaw);
                fee = getFeeFromDecodedTx(txInfoAfterSigned);
                const { body: { messages, memo } } = txInfoAfterSigned;
                const decodedMessages = messages.map(msg => {
                    const decoder = new TextDecoder();
                    const value = decoder.decode(msg.value);
                    const decodedMessage = {
                        typeUrl: msg.typeUrl,
                        value
                    }
                    return decodedMessage;
                });
                const res = { // type : send / get reward / delegate / etc
                    chainId,
                    hash,
                    type: "TBD",
                    status: "TBD",
                    height,
                    time,
                    fee,
                    gas: { gasUsed, gasWanted },
                    memo,
                    messages: decodedMessages
                }
                return res;
            }
        }
        return null;
    } else {
        return null;
    }
}

function getFeeFromDecodedTx(decodedTx) {
    const { authInfo: { fee: { amount } } } = decodedTx;
    const fee = {
        amount: 0,
        denom: "uosmo"
    }
    amount.forEach((it) => {
        fee.amount += Number(it.amount);
    });
    return fee;
}

function getMemoFromDecodedTx(decodedTx) {
    return decodedTx.body.memo;
}

async function getBlockHeightListWithTxsFromDB(minHeight) {
    if (typeof minHeight !== "number") throw "min height must be number type"
    let result = [];
    const blocks = await Block.findAll({
        where: {
            numOfTx: {
                [Op.ne]: 0
            },
            height: {
                [Op.gte]: minHeight
            }
        }
    })
    blocks.forEach(block => {
        result.push(block.dataValues.height);
    })
    return result;
}

async function getTxInfoListFromBlocksWithTxs(heightList) {
    if (heightList.length === 0) throw "The length of list is zero";
    let result = [];
    for (let i = 0; i < heightList.length; ++i) {
        const block = await axios.get(env.END_POINT + "block?height=" + String(heightList[i]));
        if (!block || !block.data) throw "block data is not valid"
        const blockData = block.data;
        const { result: { block: { header: { chain_id: chainId, time, height }, data: { txs } } } } = blockData;
        for (let j = 0; j < txs.length; ++j) {
            const txRaw = Buffer.from(txs[j], 'base64');
            const decodedTx = decodeTxRaw(txRaw);
            const { body: { messages } } = decodedTx;
            const type = messages[0].typeUrl.split(".")[3].slice(3);
            const memo = getMemoFromDecodedTx(decodedTx);
            const fee = getFeeFromDecodedTx(decodedTx);
            const hash = String(toHex(sha256(txRaw))).toUpperCase();
            if (!hash) throw "tx hash is not valid";
            const tx = await axios.get(env.END_POINT + "tx?hash=0x" + hash);
            const { result: { tx_result: { gas_wanted: gasWanted, gas_used: gasUsed, log } } } = tx.data;
            const status = log[0] === "[" ? "Success" : "Fail";
            const extractedTxInfo = {
                chainId,
                hash,
                type,
                status,
                height,
                time,
                fee,
                gas: { gasUsed, gasWanted },
                memo,
            }
            result.push(extractedTxInfo);
        }
    }
    return result;
}

async function getSuccessfulTxInfoListFromMinHeightToMaxHeight(minHeight, maxHeight) {
    if (typeof minHeight !== "number") throw "Min height is not number type";
    const _minHeight = minHeight === undefined ? 1 : minHeight;
    const _maxHeight = maxHeight === undefined ? 1 : maxHeight;
    if (!_maxHeight) throw "Max height is invalid"
    const firstSearch = await axios.get(env.LCD_END_POINT + "txs?message.action&tx.minheight=" + _minHeight + "&tx.maxheight=" + _maxHeight + "&limit=1");
    if (!firstSearch) throw "Axios error: get first search"
    const { total_count } = firstSearch.data;
    const limit = total_count;
    const successfulTxs = await axios.get(env.LCD_END_POINT + "txs?message.action&tx.minheight=" + _minHeight + "&tx.maxheight=" + _maxHeight + "&limit=" + limit);
    if (!successfulTxs) throw "Axios error: get successful tx data";
    const { count, txs } = successfulTxs.data;
    if (count !== limit) throw "Count error";
    let result = [];
    txs.forEach(txInfo => {
        const { height, txhash, gas_wanted: gasWanted, gas_used: gasUsed, tx: { value: { msg, fee: { amount }, memo } }, timestamp } = txInfo;
        const type = msg[0].type.split("/")[1].slice(3);
        const fee = {
            amount: 0,
            denom: "uosmo"
        }
        amount.forEach(it => {
            fee.amount += Number(it.amount);
        });
        const successfulTxInfo = {
            chainId: "mintchoco",
            height: Number(height),
            hash: txhash,
            type,
            status: "Success",
            height,
            time: timestamp,
            fee,
            gas: { gasUsed, gasWanted },
            memo,
        }
        result.push(successfulTxInfo);
    });
    return result;
}

module.exports = { getSuccessfulTxInfoListFromMinHeightToMaxHeight, extractTxInfo, getFeeFromDecodedTx, getBlockHeightListWithTxsFromDB, getTxInfoListFromBlocksWithTxs };