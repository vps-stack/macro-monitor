import { useEffect, useState, useContext, useMemo } from "react";
import styles from "./Products.module.scss";
import Navigation from "../components/Organisms/Navigation";
import NewFoodPanel from "../components/Organisms/NewFoodPanel";
import Macronutrient from "../components/Molecules/Macronutrient";
import banana from "../assets/images/banane_1.png";
import {
   getAllOptions,
   createOptions,
   getAllFood,
   saveConsumption,
   getConsumption,
   deleteFoodItem,
   uploadImage,
} from "../services/api";
import { OptionContext, Options, InputValues } from "../context/OptionContext";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import ProductSearchFilter from "../components/Molecules/ProductSearchFilter";
import { FilterOptions, SortOption } from "../components/Molecules/ProductSearchFilter";
import Pagination from "../components/Molecules/Pagination";

type SelectedFood = {
   [key: string]: string | number;
};

export default function Products() {
   const { setOptionsData, food, setFoodData, setConsumptionData, setInputValue } =
      useContext(OptionContext) || {};
   const [selectedFood, setSelectedFood] = useState<SelectedFood>({});
   const [loading, setLoading] = useState<string | false>(false);
   const [searchQuery, setSearchQuery] = useState("");
   const [filters, setFilters] = useState<FilterOptions>({});
   const [sortBy, setSortBy] = useState<SortOption>("none");
   const [isScrolled, setIsScrolled] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage, setItemsPerPage] = useState(20);

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

      const getFood = async () => {
         const data = await getAllFood();
         console.log({ data });

         if (data) {
            setFoodData?.(data);
         } else {
            console.warn("Failed to fetch food data");
         }
      };

      const handleScroll = () => {
         // Remove z-index after scrolling even 1px
         if (window.scrollY > 0) {
            setIsScrolled(true);
         } else {
            setIsScrolled(false);
         }
      };

      window.addEventListener("scroll", handleScroll);

      fetchOptions();
      getFood();

      return () => {
         window.removeEventListener("scroll", handleScroll);
      };
   }, [setFoodData, setOptionsData]);

   useEffect(() => {
      console.log({ selectedFood });
   }, [selectedFood]);

   // Filtered food list
   const filteredFood = useMemo(() => {
      if (!food) return [];

      // Filter
      let result = food.filter((item) => {
         const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());

         if (!matchesSearch) return false;

         const { maxCalories, minProtein, maxCarbs, maxFat } = filters;

         if (maxCalories && item.calories > maxCalories) return false;
         if (minProtein && item.protein < minProtein) return false;
         if (maxCarbs && item.carbohydrates > maxCarbs) return false;
         if (maxFat && item.fat > maxFat) return false;

         return true;
      });

      // Sort
      if (sortBy !== "none") {
         result = [...result].sort((a, b) => {
            switch (sortBy) {
               case "calories-asc":
                  return (a.calories || 0) - (b.calories || 0);
               case "calories-desc":
                  return (b.calories || 0) - (a.calories || 0);
               case "protein-asc":
                  return (a.protein || 0) - (b.protein || 0);
               case "protein-desc":
                  return (b.protein || 0) - (a.protein || 0);
               case "carbs-asc":
                  return (a.carbohydrates || 0) - (b.carbohydrates || 0);
               case "carbs-desc":
                  return (b.carbohydrates || 0) - (a.carbohydrates || 0);
               case "fat-asc":
                  return (a.fat || 0) - (b.fat || 0);
               case "fat-desc":
                  return (b.fat || 0) - (a.fat || 0);
               case "name-asc":
                  return (a.name || "").localeCompare(b.name || "");
               case "name-desc":
                  return (b.name || "").localeCompare(a.name || "");
               default:
                  return 0;
            }
         });
      }

      return result;
   }, [food, searchQuery, filters, sortBy]);

   // Reset to page 1 when search/filter changes
   useEffect(() => {
      setCurrentPage(1);
   }, [searchQuery, filters]);

   // Paginated food
   const paginatedFood = useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredFood.slice(startIndex, endIndex);
   }, [filteredFood, currentPage, itemsPerPage]);

   // Total pages
   const totalPages = Math.ceil(filteredFood.length / itemsPerPage);

   // Handle items per page change
   const handleItemsPerPageChange = (newItemsPerPage: number) => {
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1); // Reset to first page
   };

   // Scroll to top when page changes
   const handlePageChange = (page: number) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
   };

   function handleOnChange(name: string | undefined, value: string) {
      if (value === "" && name != undefined) {
         const _selectedFood = { ...selectedFood };
         delete _selectedFood[name];
         setSelectedFood(_selectedFood);
      } else {
         if (name) {
            setSelectedFood((prevSelectedFood) => ({
               ...prevSelectedFood,
               [name]: value,
            }));
         }
      }
   }

   function calculateSelectionData() {
      const dailyConsumption: Options[] = [];
      for (const key in selectedFood) {
         food?.find((foodItem) => {
            const amount = +selectedFood[key] / 100;
            if (foodItem.name === key) {
               const selectionData = {
                  name: key,
                  grams: +(amount * 100).toFixed(1),
                  calories: +(amount * foodItem.calories).toFixed(1),
                  carbohydrates: +(amount * foodItem.carbohydrates).toFixed(1),
                  fat: +(amount * foodItem.fat).toFixed(1),
                  protein: +(amount * foodItem.protein).toFixed(1),
                  saturatedFat: +(amount * foodItem.saturatedFat).toFixed(1),
                  sugar: +(amount * foodItem.sugar).toFixed(1),
                  salt: +(amount * foodItem.salt).toFixed(1),
               };
               dailyConsumption.push(selectionData);
            }
         });
      }
      return dailyConsumption;
   }

   async function handleSaveSelection() {
      if (setConsumptionData) {
         const data = calculateSelectionData();
         console.log({ data });
         await saveConsumption(data);
         const updatedData = await getConsumption();
         setConsumptionData(updatedData);
         toast.success("Food saved into daily consumption!", {
            position: "top-center",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
         });
      }
   }

   function handleCreateMenu() {
      const summerizedValues = {
         calories: 0,
         carbohydrates: 0,
         fat: 0,
         protein: 0,
         saturatedFat: 0,
         sugar: 0,
         salt: 0,
      };
      const selectedData = calculateSelectionData();
      selectedData.forEach((obj) => {
         summerizedValues.calories += +obj.calories;
         summerizedValues.carbohydrates += +obj.carbohydrates;
         summerizedValues.fat += +obj.fat;
         summerizedValues.protein += +obj.protein;
         summerizedValues.saturatedFat += +obj.saturatedFat;
         summerizedValues.sugar += +obj.sugar;
         summerizedValues.salt += +obj.salt;
      });
      console.log({ summerizedValues });
      const stringifiedValues: InputValues = {
         calories: summerizedValues.calories.toFixed(1).toString(),
         carbohydrates: summerizedValues.carbohydrates.toFixed(1).toString(),
         fat: summerizedValues.fat.toFixed(1).toString(),
         protein: summerizedValues.protein.toFixed(1).toString(),
         saturatedFat: summerizedValues.saturatedFat.toFixed(1).toString(),
         sugar: summerizedValues.sugar.toFixed(1).toString(),
         salt: summerizedValues.salt.toFixed(1).toString(),
      };

      if (setInputValue) {
         setInputValue(stringifiedValues);
      }
   }

   async function handleDeleteItem(name: string | undefined) {
      if (name) {
         await deleteFoodItem({ name });
         const data = await getAllFood();
         if (setFoodData) {
            setFoodData(data);
         }
      }
   }

   async function handleUploadImage(
      id: string,
      image: string,
      evt: React.ChangeEvent<HTMLInputElement>
   ) {
      const target = evt.target as HTMLInputElement & {
         files: FileList;
      };
      const reader = new FileReader();
      reader.readAsDataURL(target.files[0]);
      reader.onload = async function () {
         const base64Image = reader.result;
         if (base64Image) {
            setLoading(id);
            await uploadImage(id, image, base64Image);
            const data = await getAllFood();
            setLoading(false);
            if (setFoodData) {
               setFoodData(data);
            }
         }
      };
   }

   return (
      <div className={styles.products}>
         <div className={styles.inputWrapper}>
            <div className={styles.navWrapper}>
               <Navigation />
            </div>
            <NewFoodPanel handleCreateMenu={handleCreateMenu} onModalStateChange={setIsModalOpen} />
            <img className={styles.banana} src={banana} alt="A half peeled banana" />
            <div
               title="Save products with gram values into balance"
               className={styles.addButtonWrapper}
            >
               {food && food?.length > 0 && <button onClick={handleSaveSelection}>+</button>}
            </div>
         </div>
         <div className={`${styles.outerPanelWrapper} ${isScrolled || isModalOpen ? styles.scrolled : ""}`}>
            {food && food.length > 0 && (
               <ProductSearchFilter
                  onSearch={setSearchQuery}
                  onFilter={setFilters}
                  onSort={setSortBy}
                  totalProducts={food.length}
                  filteredCount={filteredFood.length}
               />
            )}

            {paginatedFood.length > 0 ? (
               paginatedFood.map((foodItem, index) => (
                  <div key={index} className={styles.productPanelWrapper}>
                     <div className={styles.titleWrapper}>
                        <div className={styles.imageWrapper}>
                           <p className={styles.image}>
                              {loading === foodItem._id ? (
                                 <ClipLoader
                                    loading={loading == foodItem._id}
                                    size={20}
                                    aria-label="Loading Spinner"
                                    data-testid="loader"
                                 />
                              ) : (
                                 foodItem.image && (
                                    <img
                                       className={styles.image_small}
                                       src={import.meta.env.VITE_CLOUDINARY_URL + foodItem.image}
                                       alt=""
                                    />
                                 )
                              )}
                              <input
                                 type="file"
                                 onChange={(evt) =>
                                    handleUploadImage(foodItem._id || "", foodItem.image || "", evt)
                                 }
                              />
                           </p>
                           <p className={styles.title}>
                              {foodItem.name}
                              {foodItem.image && (
                                 <img
                                    className={styles.image_large}
                                    src={import.meta.env.VITE_CLOUDINARY_URL + foodItem.image}
                                    alt=""
                                 />
                              )}
                           </p>
                        </div>
                     </div>
                     <div className={styles.nutrientWrapper}>
                        <div className={styles.topNutrientWrapper}>
                           <Macronutrient label="Kcal" value={foodItem.calories} />
                           <Macronutrient label="Carbs" value={foodItem.carbohydrates} />
                           <Macronutrient label="Fat" value={foodItem.fat} />
                           <Macronutrient label="Protein" value={foodItem.protein} />
                        </div>
                        <div className={styles.bottomNutrientWrapper}>
                           <Macronutrient label="Sat.Fat" value={foodItem.saturatedFat} />
                           <Macronutrient label="Sugar" value={foodItem.sugar} />
                           <Macronutrient label="Salt" value={foodItem.salt} />
                           <div className={styles.gramsWrapper}>
                              <p>g</p>
                              <input
                                 type="text"
                                 value={selectedFood[foodItem.name || "empty"]}
                                 onChange={(evt) => handleOnChange(foodItem.name, evt.target.value)}
                              />
                           </div>
                        </div>
                     </div>
                     <span className={styles.close} onClick={() => handleDeleteItem(foodItem.name)}>
                        x
                     </span>
                  </div>
               ))
            ) : (
               <div className={styles.noResults}>
                  <p>No products found matching your criteria</p>
                  <button
                     onClick={() => {
                        setSearchQuery("");
                        setFilters({});
                     }}
                  >
                     Clear filters
                  </button>
               </div>
            )}

            {filteredFood.length > 0 && (
               <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  totalItems={filteredFood.length}
               />
            )}
         </div>
      </div>
   );
}
