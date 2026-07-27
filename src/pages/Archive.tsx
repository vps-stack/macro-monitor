import {useEffect, useContext} from "react";
import Navigation from "../components/Organisms/Navigation";
import styles from "./Archive.module.scss";
import Button from "../components/Atoms/Button";
import Macronutrient from "../components/Molecules/Macronutrient";
import pasta from "../assets/images/nudeln_1.png"
import { OptionContext } from "../context/OptionContext";
import { getArchive, deleteArchiveItem, deleteArchive } from "../services/api";

export default function Archive() {
  const {archive, setArchive} = useContext(OptionContext) || [];

  useEffect(()=>{
    const getArchiveData = async() => {
      const data = await getArchive();
      if (setArchive){
        setArchive(data);
        console.log({data});
      }
    };

    getArchiveData();
  }, [setArchive]);

  function formatDate(dateString:string){
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  }

  async function deleteItem(id:string){
    await deleteArchiveItem(id);
    const data = await getArchive();
    if (setArchive){
      setArchive(data);
    }
  }

  async function resetArchive(){
    await deleteArchive();
    const data = await getArchive();
    if (setArchive){
      setArchive(data);
    }
  }

  return (
      <div className={styles.archive}>
        <div className={styles.archiveHeader}>
          <img className={styles.archiveImage} src={pasta} alt="A plate with uncooked pasta" />
        <Navigation />
        <h1>Archive</h1>
        <div className={styles.buttonWrapper}>
          <Button label="Reset" appearance="typeA" onClick={resetArchive}/>
        </div>
        </div>
        <div className={styles.outerPanelWrapper}>
          {archive?.map((obj, index)=>(
            <div key={index} className={styles.panelWrapper}>
              <div className={styles.dateWrapper}>
                <p className={styles.date}>{formatDate(obj.date || "")}</p>
                <p className={styles.grams}>{obj.grams}</p>
              </div>
              <div className={styles.macrosWrapper}>
                <Macronutrient label="Kcal" value={obj.calories} />
                <Macronutrient label="Carbs" value={obj.carbohydrates} />
                <Macronutrient label="Fat" value={obj.fat} />
                <Macronutrient label="Protein" value={obj.protein} />
                <Macronutrient label="Sat.fat" value={obj.saturatedFat} />
                <Macronutrient label="Sugar" value={obj.sugar} />
                <Macronutrient label="Salt" value={obj.salt} />
              </div>
                <span className={styles.close} onClick={()=>deleteItem(obj._id || "")}>x</span>
            </div>
          ))}
        </div>
      </div>
  )
}
