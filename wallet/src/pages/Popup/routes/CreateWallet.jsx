import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Alert, Card, Input, Button } from 'antd';
import * as wallet from '../utils/wallet';

const CreateWallet = () => {
  const navigate = useNavigate();
  const [mnemonic, setMnemonic] = useState('');
  const [pw, setPw] = useState('');

  useEffect(() => {
    const createMnemonic = async () => {
      const mnemonic = await wallet.utils.getMnemonic();
      setMnemonic(mnemonic);
    };
    createMnemonic();
  }, []);

  const onSubmit = async () => {
    if (!mnemonic) return;
    const auth = await wallet.utils.aes256Encrypt(mnemonic, pw);
    chrome.storage.session.set({ mnemonic });
    chrome.storage.sync.set({ auth });
    navigate('/popup.html');
  };

  const onChangePw = (e) => {
    setPw(e.target.value);
  };

  const onClickCancel = () => navigate(-1);

  return (
    <Card title="지갑 만들기" bordered={false}>
      <Alert
        type="warning"
        message={`Keep the mnemonic words safe`}
        description={`1. if someone else knows the mnemonic word, they can lose their assets
        2. Store in a safe place to reuse`}
      />
      <Card style={{}} bordered={false}>
        {mnemonic}
      </Card>
      <Input.Password placeholder="비밀번호" onChange={onChangePw} />
      <Input.Password
        placeholder="비밀번호"
        style={{ marginTop: 14, marginBottom: 14 }}
        onChange={onChangePw}
      />
      <Button type="primary" size="large" onClick={onSubmit}>
        생성
      </Button>
      <Button size="large" className="cancel-btn" onClick={onClickCancel}>
        취소
      </Button>
      <div style={{ marginTop: 14 }}>
        <Link to="/import">기존 지갑 가져오기</Link>
      </div>
    </Card>
  );
};

export default CreateWallet;
