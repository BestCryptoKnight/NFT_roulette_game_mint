
import useWallet_ from '../../useWallet';
import { useSelector } from 'react-redux';
import { simpleAddress } from '../../util';
import './header.css';
const Header = () => {
    const { connect } = useWallet_();
    const G = useSelector((state: any) => state);

    return (
        <div className="flex px-4 py-4 bg-[#1b1b1b] text-white">
            <div className="flex w-full justify-end">
                <button className="metamask-btn" onClick={connect}>
                    {
                        G.address.length > 0 ?
                            simpleAddress(G.address)
                            : 'Metamask'
                    }
                </button>
            </div>
        </div>
    )
}

export default Header;