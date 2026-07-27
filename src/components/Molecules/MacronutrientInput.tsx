import styles from "./MacronutrientInput.module.scss";
import { Nutrient } from "../../types/Nutrient";

type MacronutrientProps = {
    label: string
    name:Nutrient
    value:string
    onChangeHandler:(event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function MacronutrientInput({label, name, value, onChangeHandler}: MacronutrientProps) {
  return (
    <div className={styles.singleMacroWrapper}>
        <h5>{label}</h5>
        <input type="text" name={name} value={value} onChange={onChangeHandler}/>
    </div>
  )
}
