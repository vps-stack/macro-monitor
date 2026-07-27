import styles from "./MacroDataMobile.module.scss";
import { MacroItem } from "../../pages/Balance";

type MacroDataMobileProps = {
  data: MacroItem;
};

export default function MacroDataMobile({data}:MacroDataMobileProps) {
  const calculateCupClass = () => {
    const percent = +data.percent.slice(0, -1);
    console.log(percent > 89);
    
    switch (true) {
       case (percent > 89 && percent < 101): return styles.cupGreen
          break;
       case (percent > 100 && percent < 111): return styles.cupYellow
          break;
       case percent > 110: return styles.cupRed
          break;
       default: return ""
          break;
    }
 };
  return (
    <div className={styles.dataWrapper}>
        <span className={styles.percent}>{data.percent}</span>
        <div className={`${styles.cup} ${calculateCupClass()}`}></div>
        <p className={styles.title}>{data.title}</p>
        <span className={styles.amount}>{data.amount}</span>
    </div>
  )
}
