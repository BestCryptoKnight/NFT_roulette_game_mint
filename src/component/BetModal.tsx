const BetModal =({setBettingModal,bettingModal, setBettingValue, bettingValue,Addbetting}:any) => {
    return (
      <>
        <div
          className="set-bet-modal-bg"  
          onClick={() => setBettingModal(!bettingModal)}
        ></div>
        <div className="set-bet-modal-body">
          <input
            onChange={(e: any) => {
              setBettingValue(e.target.value);
            }}
            defaultValue={bettingValue}
            className="bet-value-btn"
            type="number"
          />
          <button
            onClick={() => {
              Addbetting(bettingValue);
            }}
            className="bet-confirm-btn"
          >
            Bet
          </button>
        </div>
      </>
    );
};

export default BetModal