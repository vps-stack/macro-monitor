export interface ProductSearchResult {
   name: string;
   calories: string;
   carbohydrates: string;
   fat: string;
   protein: string;
   saturatedFat: string;
   sugar: string;
   salt: string;
   imageUrl?: string;
}

interface UsdaFoodNutrient {
   nutrientName?: string;
   unitName?: string;
   value?: number | string | null;
}

interface UsdaFood {
   description?: string;
   foodNutrients?: UsdaFoodNutrient[];
}

interface UsdaSearchResponse {
   foods?: UsdaFood[];
}

export async function searchProductByName(query: string): Promise<ProductSearchResult[]> {
   try {
      console.log("Searching USDA for:", query);

      const apiKey = import.meta.env.VITE_USDA_API_KEY;

      if (!apiKey) {
         console.error("USDA API key not found in environment variables");
         return [];
      }

      const response = await fetch(
         `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(
            query
         )}&pageSize=15&dataType=Foundation,SR Legacy`
      );

      if (!response.ok) {
         console.error("USDA API error:", response.status, response.statusText);
         return [];
      }

      const data = (await response.json()) as UsdaSearchResponse;

      if (data.foods && data.foods.length > 0) {
         const results: ProductSearchResult[] = data.foods
            .map((food) => {
               // Helper to find nutrient by name AND unit
               const getNutrient = (nutrientName: string, unitName?: string): string => {
                  const nutrient = food.foodNutrients?.find((nutrient) => {
                     const nameMatch = nutrient.nutrientName === nutrientName;
                     const unitMatch = !unitName || nutrient.unitName === unitName;
                     return nameMatch && unitMatch;
                  });
                  return nutrient?.value ? String(nutrient.value) : "0";
               };

               // Convert sodium to salt
               const sodiumMg = parseFloat(getNutrient("Sodium, Na", "MG"));
               const saltG = sodiumMg > 0 ? ((sodiumMg * 2.5) / 1000).toFixed(2) : "0";

               return {
                  name: food.description || "Unknown Food",
                  calories: getNutrient("Energy", "KCAL"), // Specify KCAL not kJ
                  carbohydrates: getNutrient("Carbohydrate, by difference", "G"),
                  fat: getNutrient("Total lipid (fat)", "G"),
                  protein: getNutrient("Protein", "G"),
                  saturatedFat: getNutrient("Fatty acids, total saturated", "G"),
                  sugar: getNutrient("Total Sugars", "G"),
                  salt: saltG,
                  imageUrl: "",
               };
            })
            // Filter out incomplete entries (0 calories = bad data)
            .filter((result: ProductSearchResult) => {
               const hasCalories = parseFloat(result.calories) > 0;
               const hasProteinOrCarbs =
                  parseFloat(result.protein) > 0 || parseFloat(result.carbohydrates) > 0;
               return hasCalories && hasProteinOrCarbs;
            })
            // Limit to top 10 quality results
            .slice(0, 10);

         console.log(`Returning ${results.length} quality results`);
         return results;
      }

      console.log("No foods found in USDA");
      return [];
   } catch (error) {
      console.error("Error searching USDA:", error);
      return [];
   }
}
