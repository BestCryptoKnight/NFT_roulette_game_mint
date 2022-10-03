import { useState, useEffect } from "react";
import { BsChevronDown } from "react-icons/bs";
import { Link, useParams } from "react-router-dom";
import { roulettes } from "../../config/global.const";
import { useSelector, useDispatch } from "react-redux";
import useWallet_ from "../../useWallet";
import Slice from "../../reducer";
import axios from "axios";

import "./home.css";

const Home = () => {
  const G = useWallet_();
  const global = useSelector((state: any) => state);
  const dispatch = useDispatch();
  const update = (payload: { [key: string]: any }) => {
    dispatch(Slice.actions.update(payload));
  };
  const [games, setGames] = useState<any>([]);
  const [games_, setGames_] = useState<any>([]);

  useEffect(() => {
    getRoulettes();
  }, []);

  const getRoulettes = async () => {
    // try {
    let res = await G.getRoulettes();
    let data = [];
    let data2 = [];
    if (res) {
      for (let i = 1; i <= Number(res); i++) {
        let result = await G.getTokenURI(i);
        data.push(result);
      }
    }
    if (data) {
      console.log("data : ");
      console.log(data);

      //   array 0 is ignored
      for (let i = 1; i < data.length; i++) {
        // @ts-ignore
        const response = await axios.get(data[i]?.toString());
        console.log(i);
        console.log(response);
        if (response && response.status === 200) {
          data2.push(response.data);
        } else if (response === null) {
          console.log("bad response");
        }
      }
    }
    console.log(data2);
    setGames_(data2);
    // } catch (error) {
    //   console.log("getRoulettes : ");
    //   console.log(error);
    // }
  };

  useEffect(() => {
    console.log("games : ");
    console.log(games);
  }, [games_]);
  return (
    <section className=" h-full pt-4 home h-screen">
      <div className="container mx-auto flex flex-col">
        <div className="flex flex-wrap mx-auto w-full justify-around gap-3">
          {games_.map((item: any, index: number) => (
            <div key={index} className="h hover:scale-110 hover:cursor-pointer">
              <Link to={`roulette/${index + 2}`}>
                <img
                  src={`${item.image}`}
                  width={"450px"}
                  height={"auto"}
                  alt=""
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default Home;
