import { useContext, useEffect } from "react";
import styles from "./NewFoodPanel.module.scss";
import MacronutrientInput from "../Molecules/MacronutrientInput";
import Button from "../Atoms/Button";
import { Nutrient } from "../../types/Nutrient";
import { createFood, getAllFood, uploadImage } from "../../services/api";
import { OptionContext } from "../../context/OptionContext";
import { ToastContainer, Zoom } from "react-toastify";
import { useState } from "react";
import BarcodeScanner from "../Molecules/BarcodeScanner";
import ProductNameSearch from "../Molecules/ProductNameSearch";
import { lookupBarcode } from "../../services/productLookup";
import { downloadImageAsBase64 } from "../../services/imageHelper";
import { ProductSearchResult } from "../../services/searchProductByName";
import "react-toastify/dist/ReactToastify.css";
import { showToast } from "../Atoms/CustomToast";

type HandleCreateMenuType = () => void;

type NewFoodPanelProps = {
   handleCreateMenu: HandleCreateMenuType;
   onModalStateChange?: (isOpen: boolean) => void;
};

export default function NewFoodPanel({ handleCreateMenu, onModalStateChange  }: NewFoodPanelProps): JSX.Element {
   const { setFoodData, inputValue, setInputValue } = useContext(OptionContext);
   const [isScanning, setIsScanning] = useState(false);
   const [isSearching, setIsSearching] = useState(false);

   useEffect(() => {
    onModalStateChange?.(isScanning || isSearching);
  }, [isScanning, isSearching, onModalStateChange]);

   function handleChange(evt: React.ChangeEvent<HTMLInputElement>) {
      const name = evt.target.name;
      const value = evt.target.value;
      console.log({ name, value });
      if (setInputValue) {
         setInputValue((prevInputValue) => ({
            ...prevInputValue,
            [name]: value,
         }));
      }
   }

   type InputValue = {
      name: string;
      calories: string;
      carbohydrates: string;
      fat: string;
      protein: string;
      saturatedFat: string;
      sugar: string;
      salt: string;
   };

   function sanitizeInput(inputValue: InputValue): InputValue | null {
      const fields: (keyof Omit<InputValue, "imageUrl">)[] = [
         // Exclude imageUrl from validation
         "name",
         "calories",
         "carbohydrates",
         "fat",
         "protein",
         "saturatedFat",
         "sugar",
         "salt",
      ];

      const sanitized: Partial<InputValue> = {};

      for (const key of fields) {
         const value = inputValue[key];

         if (key === "name") {
            const trimmedName = typeof value === "string" ? value.trim() : "";
            if (!trimmedName) {
               console.error("Validation failed: Name is empty");
               return null;
            }
            sanitized.name = trimmedName;
         } else {
            // Handle numeric fields - allow "0" as valid
            if (typeof value === "string") {
               const trimmed = value.trim();

               // If empty, default to "0"
               if (trimmed === "") {
                  sanitized[key] = "0";
                  continue;
               }

               const replaced = trimmed.replace(",", ".");
               const testFloat = parseFloat(replaced);

               if (isNaN(testFloat)) {
                  console.error(`Validation failed: ${key} is not a number (${trimmed})`);
                  return null;
               }

               sanitized[key] = replaced;
            } else {
               // If undefined/null, default to "0"
               sanitized[key] = "0";
            }
         }
      }

      return sanitized as InputValue;
   }

   async function handleAddToList() {
      if (inputValue && setInputValue) {
         if (!inputValue.name) return handleValidationError("Name is required!");
         if (
            inputValue.calories === "" ||
            inputValue.carbohydrates === "" ||
            inputValue.fat === "" ||
            inputValue.protein === "" ||
            inputValue.saturatedFat === "" ||
            inputValue.sugar === "" ||
            inputValue.salt === ""
         )
            return handleValidationError("All fields must have a value!");

         const sanitized = sanitizeInput(inputValue as InputValue);
         if (!sanitized) return handleValidationError("Invalid data format!");

         console.log("Creating food with data:", sanitized);

         try {
            // Save the food item first
            const response = await createFood(sanitized);

            if (!response) {
               return handleValidationError("Failed to save food. Check console for details.");
            }

            if (response.errors) {
               return handleValidationError(response.errors[0].msg);
            }

            const foodId = response.data?._id || response._id || response.id;

            if (!foodId) {
               showToast.error("Food saved but no ID returned");
            }

            console.log("Image URL from scan:", inputValue.imageUrl);

            // If there's an image URL from barcode scan, upload it
            if (inputValue.imageUrl && foodId) {
               showToast.info("Uploading product image...");

               try {
                  const base64Image = await downloadImageAsBase64(inputValue.imageUrl);

                  if (base64Image) {
                     await uploadImage(foodId, "", base64Image);

                     showToast.success("Image uploaded!");
                  } else {
                     showToast.error("Failed to download product image");
                  }
               } catch (error) {
                  showToast.error("Image upload failed");
               }
            }

            setInputValue({
               name: "",
               calories: "",
               carbohydrates: "",
               fat: "",
               protein: "",
               saturatedFat: "",
               sugar: "",
               salt: "",
               imageUrl: "",
            });

            // Refresh food list
            const data = await getAllFood();
            if (setFoodData) {
               setFoodData(data);
            }

            showToast.success("Food item created successfully!");
         } catch (error) {
            handleValidationError("An error occurred while saving");
         }
      }
   }

   function handleValidationError(message: string) {
      showToast.error(message);
   }

   async function handleBarcodeScanned(barcode: string) {
      showToast.info("Looking up product...");

      const productData = await lookupBarcode(barcode);

      if (productData && setInputValue) {
         setInputValue(productData);

         showToast.success(`Found: ${productData.name}`);
      } else {
         showToast.error("Product not found in Open Food Facts database");
      }
   }

   function handleProductSelected(product: ProductSearchResult) {
      if (setInputValue) {
         setInputValue(product);
      }
   }

   return (
      <div className={styles.panelWrapper}>
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
         <h1>New Food Item</h1>
         <div className={styles.scannerWrapper}></div>
         <div className={styles.panel}>
            <div className={styles.nameWrapper}>
               <h4>{"Name"}</h4>
               <div className={styles.nameInputGroup}>
                  <input
                     type="text"
                     name="name"
                     value={inputValue?.name || ""}
                     onChange={handleChange}
                  />
                  <div className={styles.iconButtons}>
                     <ProductNameSearch
                        searchQuery={inputValue?.name || ""}
                        onSelect={handleProductSelected}
                        onModalStateChange={setIsSearching} 
                     />
                     <BarcodeScanner
                        onScan={handleBarcodeScanned}
                        isScanning={isScanning}
                        setIsScanning={setIsScanning}
                     />
                  </div>
               </div>
            </div>
            <div className={styles.macrosWrapper}>
               <MacronutrientInput
                  label={"Kcal"}
                  name={Nutrient.Calories}
                  value={inputValue?.calories || ""}
                  onChangeHandler={handleChange}
               />
               <div className={styles.innerMacrosWrapper}>
                  <MacronutrientInput
                     label={"Carbs"}
                     name={Nutrient.Carbohydrates}
                     value={inputValue?.carbohydrates || ""}
                     onChangeHandler={handleChange}
                  />
                  <MacronutrientInput
                     label={"Fat"}
                     name={Nutrient.Fat}
                     value={inputValue?.fat || ""}
                     onChangeHandler={handleChange}
                  />
                  <MacronutrientInput
                     label={"Protein"}
                     name={Nutrient.Protein}
                     value={inputValue?.protein || ""}
                     onChangeHandler={handleChange}
                  />
                  <MacronutrientInput
                     label={"Sat.fat"}
                     name={Nutrient.SaturatedFat}
                     value={inputValue?.saturatedFat || ""}
                     onChangeHandler={handleChange}
                  />
                  <MacronutrientInput
                     label={"Sugar"}
                     name={Nutrient.Sugar}
                     value={inputValue?.sugar || ""}
                     onChangeHandler={handleChange}
                  />
                  <MacronutrientInput
                     label={"Salt"}
                     name={Nutrient.Salt}
                     value={inputValue?.salt || ""}
                     onChangeHandler={handleChange}
                  />
               </div>
            </div>
         </div>
         <div className={styles.buttonWrapper}>
            <Button label={"Add to list"} appearance={"typeA"} onClick={handleAddToList} />
            <Button label={"Create menu"} appearance={"typeB"} onClick={handleCreateMenu} />
         </div>
      </div>
   );
}
