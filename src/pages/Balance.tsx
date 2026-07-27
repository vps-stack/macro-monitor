import { useState, useEffect, useContext } from "react";
import vector1 from "../assets/images/Vector_1.png";
import orange from "../assets/images/orange.png";
import dish from "../assets/images/balance-dish.png";
import styles from "./Balance.module.scss";
import Navigation from "../components/Organisms/Navigation";
import MacroCups from "../components/Organisms/MacroCups";
import ConsumptionPanel from "../components/Organisms/ConsumptionPanel";
import Button from "../components/Atoms/Button";
import MacroDataMobile from "../components/Organisms/MacroDataMobile";
import { OptionContext } from "../context/OptionContext";
import {
   getConsumption,
   deleteConsumptionItem,
   deleteConsumption,
   getAllOptions,
   createOptions,
   createArchiveItem,
} from "../services/api";
import { ToastContainer, toast, Zoom } from "react-toastify";

export type MacroItem = {
   wrapperClass:
      | "carbsWrapper"
      | "fatWrapper"
      | "proteinWrapper"
      | "saturatedFatWrapper"
      | "sugarWrapper"
      | "saltWrapper"
      | "caloriesWrapper";
   title: string;
   amount: number;
   percent: string;
};

export type ConsumptionItem = {
   name: string;
   grams: number;
   kcal: number;
   carbs: number;
   fat: number;
   protein: number;
   satFat: number;
   sugar: number;
   salt: number;
};

const createInitialMacroBalance = (): MacroItem[] => [
   { wrapperClass: "carbsWrapper", title: "Carbs", amount: 0, percent: "0%" },
   { wrapperClass: "fatWrapper", title: "Fat", amount: 0, percent: "0%" },
   { wrapperClass: "proteinWrapper", title: "Protein", amount: 0, percent: "0%" },
   { wrapperClass: "saturatedFatWrapper", title: "Sat. fat", amount: 0, percent: "0%" },
   { wrapperClass: "sugarWrapper", title: "Sugar", amount: 0, percent: "0%" },
   { wrapperClass: "saltWrapper", title: "Salt", amount: 0, percent: "0%" },
   { wrapperClass: "caloriesWrapper", title: "Calories", amount: 0, percent: "0%" },
];

export default function Balance() {
   const { consumption, setConsumptionData, options, setOptionsData, setArchiveItem } =
      useContext(OptionContext) || [];
   const [macroBalance, setMacroBalance] = useState<MacroItem[]>(createInitialMacroBalance);

   useEffect(() => {
      const fetchOptions = async () => {
         const initialFetch = await getAllOptions();
         if (setOptionsData) {
            if (initialFetch.length > 0) {
               setOptionsData(() => initialFetch[0]);
            } else {
               const optionsData = await createOptions({ calories: 2000 });
               setOptionsData(() => optionsData.data);
            }
         }
      };

      const getData = async () => {
         try {
            const consumptionData = await getConsumption();
            console.log("After fetch", { consumptionData });

            if (setConsumptionData) {
               console.log("Setting consumption");
               setConsumptionData(consumptionData);
            }
         } catch (error) {
            console.error("Error fetching consumption data:", error);
         }
      };
      fetchOptions();
      getData();
   }, [setConsumptionData, setOptionsData]);


   async function deleteOneConsumptionItem(id: string) {
      await deleteConsumptionItem(id);
      const consumptionData = await getConsumption();
      if (setConsumptionData) {
         setConsumptionData(consumptionData);
      }
   }

   useEffect(() => {
      console.log("updated", { consumption, options });
      const summerizedValues = {
         calories: 0,
         carbohydrates: 0,
         fat: 0,
         protein: 0,
         saturatedFat: 0,
         sugar: 0,
         salt: 0,
      };
      const _macroBalance = createInitialMacroBalance();

      consumption?.forEach((obj) => {
         summerizedValues.calories += +obj.calories;
         summerizedValues.carbohydrates += +obj.carbohydrates;
         summerizedValues.fat += +obj.fat;
         summerizedValues.protein += +obj.protein;
         summerizedValues.saturatedFat += +obj.saturatedFat;
         summerizedValues.sugar += +obj.sugar;
         summerizedValues.salt += +obj.salt;
      });
      if (options) {
         console.log("inside options");
         const balanceData = {
            calories: Math.round((summerizedValues.calories * 100) / options?.calories),
            carbohydrates: Math.round(
               ((((summerizedValues.carbohydrates * 4) / summerizedValues.calories) * 100) /
                  (((options?.carbohydrates * 4) / options?.calories) * 100)) *
                  100
            ),
            fat: Math.round(
               ((((summerizedValues.fat * 9) / summerizedValues.calories) * 100) /
                  (((options?.fat * 9) / options?.calories) * 100)) *
                  100
            ),
            protein: Math.round(
               ((((summerizedValues.protein * 4) / summerizedValues.calories) * 100) /
                  (((options?.protein * 4) / options?.calories) * 100)) *
                  100
            ),
            saturatedFat: Math.round(
               ((((summerizedValues.saturatedFat * 9) / summerizedValues.calories) * 100) /
                  (((options?.saturatedFat * 9) / options?.calories) * 100)) *
                  100
            ),
            sugar: Math.round(
               ((((summerizedValues.sugar * 4) / summerizedValues.calories) * 100) /
                  (((options?.sugar * 4) / options?.calories) * 100)) *
                  100
            ),
            salt: Math.round((summerizedValues.salt * 100) / options?.salt),
         };

         console.log(
            summerizedValues.saturatedFat,
            summerizedValues.calories,
            options?.saturatedFat,
            options?.calories,
            ((options?.saturatedFat * 9) / options?.calories) * 100
         );

         _macroBalance[6].amount = +summerizedValues.calories.toFixed(1);
         _macroBalance[6].percent = isNaN(balanceData.calories) ? "0%" : balanceData.calories + "%";
         _macroBalance[0].amount = +summerizedValues.carbohydrates.toFixed(1);
         _macroBalance[0].percent = isNaN(balanceData.carbohydrates)
            ? "0%"
            : balanceData.carbohydrates + "%";
         _macroBalance[1].amount = +summerizedValues.fat.toFixed(1);
         _macroBalance[1].percent = isNaN(balanceData.fat) ? "0%" : balanceData.fat + "%";
         _macroBalance[2].amount = +summerizedValues.protein.toFixed(1);
         _macroBalance[2].percent = isNaN(balanceData.protein) ? "0%" : balanceData.protein + "%";
         _macroBalance[3].amount = +summerizedValues.saturatedFat.toFixed(1);
         _macroBalance[3].percent = isNaN(balanceData.saturatedFat)
            ? "0%"
            : balanceData.saturatedFat + "%";
         _macroBalance[4].amount = +summerizedValues.sugar.toFixed(1);
         _macroBalance[4].percent = isNaN(balanceData.sugar) ? "0%" : balanceData.sugar + "%";
         _macroBalance[5].amount = +summerizedValues.salt.toFixed(1);
         _macroBalance[5].percent = isNaN(balanceData.salt) ? "0%" : balanceData.salt + "%";

         setMacroBalance(_macroBalance);
      }
   }, [consumption, options]);

   async function resetList() {
      await deleteConsumption();
      const consumptionData = await getConsumption();
      if (setConsumptionData) {
         setConsumptionData(consumptionData);
      }
   }

   async function handleCalculateArchive() {
      const summarizedConsumption = {
         date: "",
         grams: 0,
         calories: 0,
         carbohydrates: 0,
         fat: 0,
         protein: 0,
         saturatedFat: 0,
         sugar: 0,
         salt: 0,
      };
      if (consumption) {
         const _consumption = [...consumption];
         _consumption.forEach((obj) => {
            summarizedConsumption.grams += Math.round(obj.grams || 0);
            summarizedConsumption.calories += Math.round(obj.calories || 0);
            summarizedConsumption.carbohydrates += Math.round(obj.carbohydrates || 0);
            summarizedConsumption.fat += Math.round(obj.fat || 0);
            summarizedConsumption.protein += Math.round(obj.protein || 0);
            summarizedConsumption.saturatedFat += Math.round(obj.saturatedFat || 0);
            summarizedConsumption.sugar += Math.round(obj.sugar || 0);
            summarizedConsumption.salt += Math.round(obj.salt || 0);
         });
         const date = new Date();
         const day = date.getDate();
         const month = date.getMonth() + 1;
         const year = date.getFullYear();
         const today = `${year}-${month}-${day}`;
         summarizedConsumption.date = today;

         await createArchiveItem(summarizedConsumption);
         if (setArchiveItem) {
            setArchiveItem(summarizedConsumption);
            toast.success("Food saved into archive!", {
               position: "top-center",
               autoClose: 2000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: true,
               progress: undefined,
               theme: "colored",
            });
            console.log({ summarizedConsumption });
         }
      }
   }

   return (
      <>
         <ToastContainer
            position="top-center"
            transition={Zoom}
            autoClose={5000}
            hideProgressBar
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
         />
         <div className={styles.balance}>
            <Navigation />
            <div className={styles.mainWrapper}>
               <div className={styles.headerContainer}>
                  <h1>Daily intake</h1>
                  <div className={styles.buttonWrapper}>
                     <Button label="Reset" onClick={resetList} appearance="typeA" />
                     <Button label="Archivate" onClick={handleCalculateArchive} appearance="typeB">
                        <img src={orange} alt="orange" />
                     </Button>
                  </div>
                  <img src={dish} alt="Dish on a plate" />
               </div>
               <div className={styles.macroWrapper}>
                  {macroBalance.map((obj, index) => (
                     <MacroDataMobile key={index} data={obj} />
                  ))}
               </div>
            </div>
            <img className={styles.vector1} src={vector1} alt="curved background"></img>
            <div className={styles.infoCircle}>
               {macroBalance.map((obj, index) => (
                  <MacroCups key={index} data={obj} />
               ))}
            </div>
         </div>
         <h2 className={styles.consumption}>Consumption</h2>
         <div className={styles.consumptionOuterWrapper}>
            {consumption &&
               consumption.map((obj, index) => (
                  <ConsumptionPanel deleteItem={deleteOneConsumptionItem} key={index} data={obj} />
               ))}
         </div>
      </>
   );
}
