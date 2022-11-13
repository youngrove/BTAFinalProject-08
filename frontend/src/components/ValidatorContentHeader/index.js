import styled from 'styled-components'
import { IoPeople } from 'react-icons/io5'
import { GiToken } from 'react-icons/gi'
import { AiOutlineFieldTime } from 'react-icons/ai'
import { Icon } from '@iconify/react'
import { headerColor, headerText } from '../../utils/color'
import ValidatorContentHeaderBlock from './ValidatorContentHeaderBlock'

const ContentHeader = styled.div`
    width: 100%;
    height: 220px;
`
const ContentHeaderText = styled.div`
    font-size: 28px;
    height: 20%;
    width: 100%;
    font-weight: 500;
    color: ${headerColor};
`
const ContnetHeaderBlockWrapper = styled.div`
    width: 100%;
    height: 80%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`

export default function ValidatorContentHeader({
    height,
    blockTime,
    totalVal,
    bondedTokens,
}) {
    return (
        <ContentHeader>
            <ContentHeaderText>VALIDATORS</ContentHeaderText>
            <ContnetHeaderBlockWrapper>
                <ValidatorContentHeaderBlock
                    headername={'Height'}
                    data={height}
                    icon={
                        <Icon
                            icon="clarity:blocks-group-solid"
                            width="22"
                            style={{ marginRight: 5 }}
                        />
                    }
                />
                <ValidatorContentHeaderBlock
                    headername={'Validators'}
                    data={totalVal}
                    icon={<IoPeople size={22} style={{ marginRight: 5 }} />}
                />
                <ValidatorContentHeaderBlock
                    headername={'Bonded Tokens'}
                    data={bondedTokens}
                    icon={<GiToken size={22} style={{ marginRight: 5 }} />}
                />
                <ValidatorContentHeaderBlock
                    headername={'Block Time'}
                    data={blockTime + 's'}
                    icon={
                        <AiOutlineFieldTime
                            size={22}
                            style={{ marginRight: 5 }}
                        />
                    }
                />
            </ContnetHeaderBlockWrapper>
        </ContentHeader>
    )
}
