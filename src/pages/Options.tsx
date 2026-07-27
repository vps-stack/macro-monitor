import { useState, useContext } from "react";
import styles from "./Options.module.scss";
import Navigation from "../components/Organisms/Navigation";
import OptionItem from "../components/Molecules/OptionItem";
import Button from "../components/Atoms/Button";
import { OptionContext } from "../context/OptionContext";
import { Nutrient } from "../types/Nutrient";
import { updateOptions } from "../services/api";

export default function Options() {
  const {options, setOptionsData} = useContext(OptionContext);
  const [inputValue, setInputValue] = useState({calories:"", carbohydrates:"", fat:"", protein:"", saturatedFat:"", sugar:"", salt:""});
  const [validationError, setValidationError] = useState<string>("");
  
  async function handleClick(){
    setValidationError("");
    const response = validateInput();
    
    if (response?.valid === true) {
      const data = await updateOptions({...inputValue, id:options?._id});
      if (setOptionsData){
        setOptionsData(data?.data);
        setInputValue({calories:"", carbohydrates:"", fat:"", protein:"", saturatedFat:"", sugar:"", salt:""});
      }
      console.log({data});
    }
  }

  function validateInput(){
    if (+inputValue.calories == ("" || 0) || +inputValue.carbohydrates == ("" || 0) || +inputValue.fat == ("" || 0) || +inputValue.protein == ("" || 0) || +inputValue.saturatedFat == ("" || 0) || +inputValue.sugar == ("" || 0) || +inputValue.salt == ("" || 0) ) return {valid:false, msg:setValidationError("All fields must have a value greater than 0!")};
    if (+inputValue.calories <= 100) return {valid:false, msg:setValidationError("Calories must have a value greater than 100!")};
    if (+inputValue.carbohydrates > 0 || +inputValue.fat > 0 || +inputValue.protein > 0){
      if (+inputValue.carbohydrates + +inputValue.fat + +inputValue.protein !== 1) return {valid:false, msg:setValidationError("Carbs, fat and protein must equal to the amount of 1!")};
    }
    if (+inputValue.saturatedFat > +inputValue.fat) return {valid:false, msg:setValidationError("Saturated fat cannot be higher then fat!")};
    if (+inputValue.sugar > +inputValue.carbohydrates) return {valid:false, msg:setValidationError("Sugar cannot be higher than carbohydrates!")};
    return {valid:true}
  }

  function handleInputChange(evt:React.ChangeEvent<HTMLInputElement>){
    const name = evt.target.name;
    const value = evt.target.value;
    setInputValue({...inputValue, [name]:value})
  }

  return (
    <div className={styles.options}>
        <div className={styles.navWrapper}>
            <Navigation />
        </div>
        <h1>Options</h1>
        <h2>Limit values</h2>
          {validationError && <p className={styles.errorMessage}>{validationError}</p>}
          <OptionItem label="Calories" placeholder="g" name={Nutrient.Calories} gramValue={options?.calories} value={inputValue?.calories} onChangeHandler={handleInputChange}/>
          <OptionItem label="Carbohydrates"placeholder="%" name={Nutrient.Carbohydrates} gramValue={options?.carbohydrates} value={inputValue?.carbohydrates} calculated={options?.calories && (options?.carbohydrates * 4 / options?.calories).toFixed(2)} onChangeHandler={handleInputChange}/>
          <OptionItem label="Fat" placeholder="%" name={Nutrient.Fat} gramValue={options?.fat} value={inputValue?.fat} calculated={options?.calories && (options?.fat * 9 / options?.calories).toFixed(2)} onChangeHandler={handleInputChange}/>
          <OptionItem label="Protein" placeholder="%" name={Nutrient.Protein} gramValue={options?.protein} value={inputValue?.protein} calculated={options?.calories && (options?.protein * 4 / options?.calories).toFixed(2)} onChangeHandler={handleInputChange}/>
          <OptionItem label="Saturated fat" placeholder="%" name={Nutrient.SaturatedFat} gramValue={options?.saturatedFat} value={inputValue?.saturatedFat} calculated={options?.calories && (options?.saturatedFat * 9 / options?.calories).toFixed(2)} onChangeHandler={handleInputChange}/>
          <OptionItem label="Sugar" placeholder="%" name={Nutrient.Sugar} gramValue={options?.sugar} value={inputValue?.sugar} calculated={options?.calories && (options?.sugar * 4 / options?.calories).toFixed(2)} onChangeHandler={handleInputChange}/>
          <OptionItem label="Salt" placeholder="g" name={Nutrient.Salt} gramValue={options?.salt} value={inputValue?.salt} onChangeHandler={handleInputChange}/>
        <div className={styles.buttonWrapper}>
            <Button label="Save" type="submit" appearance="typeB" onClick={handleClick}/>
        </div>
    </div>
  )
}
