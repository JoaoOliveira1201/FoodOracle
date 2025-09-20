import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/contexts/AuthContext";
import Button from "~/components/Button";

interface Product {
  product_id: number;
  name: string;
  base_price: number;
  discount_percentage: number;
  requires_refrigeration: boolean;
  shelf_life_days: number;
  deadline_to_discount: number;
}

interface Quote {
  quote_id: number;
  supplier_id: number;
  product_id: number;
  pdf_document_path: string | null;
  status: "Pending" | "Approved" | "Rejected";
  submission_date: string;
}

interface Warehouse {
  warehouse_id: number;
  name: string;
  normal_capacity_kg: number;
  refrigerated_capacity_kg: number;
  products_in_storage: any[];
}

interface ApprovedProduct extends Product {
  quote_id: number;
}

interface ProductRecordFormData {
  product_id: number;
  warehouse_id: number;
  quantity_kg: number;
  image_file: File | null;
}

interface QualityClassification {
  classification: string;
  raw_response?: string;
  error?: string;
}

interface RecommendedWarehouse {
  warehouse_id: number;
  name: string;
  distance: number;
  reason: string;
}

export function RegisterProductRecord() {
  const navigate = useNavigate();
  const { user, isSupplier } = useAuth();
  const [approvedProducts, setApprovedProducts] = useState<ApprovedProduct[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendedWarehouse, setRecommendedWarehouse] = useState<RecommendedWarehouse | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [qualityClassification, setQualityClassification] = useState<QualityClassification | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [formData, setFormData] = useState<ProductRecordFormData>({
    product_id: 0,
    warehouse_id: 0,
    quantity_kg: 0,
    image_file: null,
  });

  useEffect(() => {
    if (!isSupplier() || !user) {
      setError("Access denied. Only suppliers can register product records.");
      setLoading(false);
      return;
    }

    fetchData();
  }, [user, isSupplier]);

  // Trigger recommendation when form data changes
  useEffect(() => {
    if (formData.product_id > 0 && formData.quantity_kg > 0 && approvedProducts.length > 0 && warehouses.length > 0) {
      getWarehouseRecommendation(formData.product_id, formData.quantity_kg);
    }
  }, [formData.product_id, formData.quantity_kg, approvedProducts.length, warehouses.length]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch supplier's approved quotes
      const quotesResponse = await fetch(`http://34.235.125.104:8000/quotes/?supplier_id=${user?.user_id}`);
      if (!quotesResponse.ok) {
        throw new Error(`Failed to fetch quotes: ${quotesResponse.status}`);
      }
      const quotesData: Quote[] = await quotesResponse.json();
      const approvedQuotes = quotesData.filter((quote) => quote.status === "Approved");

      // Fetch all products
      const productsResponse = await fetch("http://34.235.125.104:8000/products/");
      if (!productsResponse.ok) {
        throw new Error(`Failed to fetch products: ${productsResponse.status}`);
      }
      const productsData: Product[] = await productsResponse.json();

      // Combine approved quotes with product details
      const approvedProductsData: ApprovedProduct[] = approvedQuotes
        .map((quote) => {
          const product = productsData.find((p) => p.product_id === quote.product_id);
          return {
            ...product!,
            quote_id: quote.quote_id,
          };
        })
        .filter(Boolean);

      // Fetch all warehouses
      const warehousesResponse = await fetch("http://34.235.125.104:8000/warehouses/");
      if (!warehousesResponse.ok) {
        throw new Error(`Failed to fetch warehouses: ${warehousesResponse.status}`);
      }
      const warehousesData: Warehouse[] = await warehousesResponse.json();

      setApprovedProducts(approvedProductsData);
      setWarehouses(warehousesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const getWarehouseRecommendation = async (productId: number, quantity: number) => {
    if (!user || productId === 0 || quantity <= 0) {
      setRecommendedWarehouse(null);
      return;
    }

    try {
      setLoadingRecommendation(true);

      // Find the selected product to get refrigeration requirements
      const selectedProduct = approvedProducts.find((p) => p.product_id === productId);
      if (!selectedProduct) return;

      // Filter suitable warehouses based on product requirements
      const suitableWarehouses = warehouses.filter((warehouse) => {
        if (selectedProduct.requires_refrigeration) {
          return warehouse.refrigerated_capacity_kg && warehouse.refrigerated_capacity_kg > 0;
        }
        return warehouse.normal_capacity_kg && warehouse.normal_capacity_kg > 0;
      });

      if (suitableWarehouses.length > 0) {
        // Sort by capacity (highest first) to recommend the warehouse with most available space
        const sortedWarehouses = suitableWarehouses.sort((a, b) => {
          const capacityA = selectedProduct.requires_refrigeration
            ? a.refrigerated_capacity_kg || 0
            : a.normal_capacity_kg || 0;
          const capacityB = selectedProduct.requires_refrigeration
            ? b.refrigerated_capacity_kg || 0
            : b.normal_capacity_kg || 0;
          return capacityB - capacityA;
        });

        const recommended = sortedWarehouses[0];
        const recommendedCapacity = selectedProduct.requires_refrigeration
          ? recommended.refrigerated_capacity_kg
          : recommended.normal_capacity_kg;

        setRecommendedWarehouse({
          warehouse_id: recommended.warehouse_id,
          name: recommended.name,
          distance: 0, // Would be calculated by backend
          reason: selectedProduct.requires_refrigeration
            ? `Best for refrigerated products (${recommendedCapacity}kg refrigerated capacity)`
            : `Best for normal storage (${recommendedCapacity}kg normal capacity)`,
        });
      } else {
        setRecommendedWarehouse(null);
      }
    } catch (err) {
      setRecommendedWarehouse(null);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: name === "product_id" || name === "warehouse_id" || name === "quantity_kg" ? parseInt(value) || 0 : value,
    };
    setFormData(newFormData);

    // Trigger recommendation when product or quantity changes
    if (name === "product_id" || name === "quantity_kg") {
      const productId = name === "product_id" ? parseInt(value) || 0 : newFormData.product_id;
      const quantity = name === "quantity_kg" ? parseInt(value) || 0 : newFormData.quantity_kg;
      getWarehouseRecommendation(productId, quantity);

      // Trigger image classification if product changes and image is already selected
      if (name === "product_id" && newFormData.image_file && productId > 0) {
        setQualityClassification(null); // Reset classification when product changes
        classifyImage(newFormData.image_file, productId);
      }
    }
  };

  const handleUseRecommendation = () => {
    if (recommendedWarehouse) {
      setFormData((prev) => ({
        ...prev,
        warehouse_id: recommendedWarehouse.warehouse_id,
      }));
    }
  };

  const mapQualityClassification = (apiClassification: string): string => {
    switch (apiClassification) {
      case "GOOD":
        return "Good";
      case "SUBOPTIMAL":
        return "Sub-optimal";
      case "BAD":
        return "Bad";
      case "WRONG_PRODUCT":
        // For wrong product, we'll default to Bad since it's not acceptable
        return "Bad";
      default:
        return "Bad"; // Default to Bad for unknown classifications
    }
  };

  const classifyImage = async (imageFile: File, productId: number) => {
    if (!imageFile || productId === 0) {
      setQualityClassification(null);
      return;
    }

    try {
      setIsClassifying(true);
      setError("");

      const classificationFormData = new FormData();
      classificationFormData.append("product_id", productId.toString());
      classificationFormData.append("image", imageFile);

      const response = await fetch("http://34.235.125.104:8000/quality-control/classify", {
        method: "POST",
        body: classificationFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to classify image");
      }

      const result = await response.json();
      setQualityClassification(result);

      if (result.error) {
        setError(`Quality classification error: ${result.error}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to classify image quality");
      setQualityClassification(null);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      // Validate file type (images only)
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(files[0].type)) {
        setError("Only image files (JPEG, PNG, GIF, WebP) are allowed.");
        return;
      }

      // Validate file size (max 5MB)
      if (files[0].size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB.");
        return;
      }

      setError("");
      setQualityClassification(null); // Reset classification when image changes
      setFormData((prev) => ({ ...prev, image_file: files[0] }));

      // Trigger image classification if product is selected
      if (formData.product_id > 0) {
        classifyImage(files[0], formData.product_id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("User authentication required.");
      return;
    }

    if (formData.product_id === 0) {
      setError("Please select a product.");
      return;
    }

    if (formData.warehouse_id === 0) {
      setError("Please select a warehouse or use the recommended one.");
      return;
    }

    if (formData.quantity_kg <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    if (!formData.image_file) {
      setError("Product image is required.");
      return;
    }

    if (!qualityClassification) {
      setError("Please wait for quality classification to complete.");
      return;
    }

    if (qualityClassification.error || qualityClassification.classification === "ERROR") {
      setError("Quality classification failed. Please try uploading a different image.");
      return;
    }

    // Prevent submission if quality is WRONG_PRODUCT
    if (qualityClassification.classification === "WRONG_PRODUCT") {
      setError(
        "The uploaded image doesn't match the selected product. Please upload the correct product image or select the right product."
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const submitFormData = new FormData();
      submitFormData.append("product_id", formData.product_id.toString());
      submitFormData.append("warehouse_id", formData.warehouse_id.toString());
      submitFormData.append("quantity_kg", formData.quantity_kg.toString());
      submitFormData.append("quality_classification", mapQualityClassification(qualityClassification.classification));
      submitFormData.append("status", "InStock");
      submitFormData.append("supplier_user_id", user.user_id.toString());

      if (formData.image_file) {
        submitFormData.append("image_file", formData.image_file);
      }

      const response = await fetch("http://34.235.125.104:8000/product-records/", {
        method: "POST",
        body: submitFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to register product record");
      }

      const result = await response.json();

      // Success - navigate back to product records page using the message from backend
      navigate("/supplier-product-records", {
        state: {
          message: `${result.message} (Record ID: ${result.record_id})`,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register product record");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading data...</span>
      </div>
    );
  }

  if (error && approvedProducts.length === 0 && warehouses.length === 0) {
    return (
      <div className="px-28 pt-14">
        <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">Error: {error}</div>
        <div className="mt-4">
          <Button
            color="secondary"
            label="Back to Product Records"
            onClick={() => navigate("/supplier-product-records")}
          />
        </div>
      </div>
    );
  }

  if (approvedProducts.length === 0) {
    return (
      <div className="px-28 pt-14">
        <h1 className="text-4xl font-bold mb-6">Register Product Record</h1>
        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300 mb-2">No Approved Products</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
            You don't have any approved products yet. You need to submit quotes and get them approved before you can
            register product records.
          </p>
          <div className="flex space-x-4">
            <Button color="primary" label="Submit Quotes" onClick={() => navigate("/supplier-products")} />
            <Button color="secondary" label="Back to Records" onClick={() => navigate("/supplier-product-records")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-28 pt-14">
      <div className="mb-6">
        <h1 className="text-4xl font-bold">Product Registration</h1>
        <p className="text-gray-600 mt-2">Product registration with AI-assisted validation and quality control.</p>
      </div>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          Register a new batch of products that you want to add to inventory. You can only register products that have
          been approved through the quote process.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Product <span className="text-red-500">*</span>
          </label>
          <select
            name="product_id"
            value={formData.product_id}
            onChange={handleInputChange}
            required
            className="w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={0}>Select a product...</option>
            {approvedProducts.map((product) => (
              <option key={product.product_id} value={product.product_id}>
                {product.name} {product.requires_refrigeration ? "🧊" : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Only showing products that have been approved for your supplier account
          </p>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Warehouse <span className="text-red-500">*</span>
          </label>

          {/* Warehouse Recommendation */}
          {loadingRecommendation && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-800 dark:text-blue-300">Finding optimal warehouse...</span>
              </div>
            </div>
          )}

          {recommendedWarehouse && !loadingRecommendation && (
            <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-800 dark:text-green-300">
                    🎯 Recommended: {recommendedWarehouse.name}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-400">{recommendedWarehouse.reason}</div>
                </div>
                <button
                  type="button"
                  onClick={handleUseRecommendation}
                  className="px-3 py-1 text-xs font-medium text-green-800 bg-green-100 border border-green-300 rounded hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:border-green-600 dark:hover:bg-green-700"
                >
                  Use This
                </button>
              </div>
            </div>
          )}

          <select
            name="warehouse_id"
            value={formData.warehouse_id}
            onChange={handleInputChange}
            required
            className="w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={0}>Select a warehouse...</option>
            {warehouses.map((warehouse) => (
              <option
                key={warehouse.warehouse_id}
                value={warehouse.warehouse_id}
                className={
                  warehouse.warehouse_id === recommendedWarehouse?.warehouse_id ? "bg-green-100 dark:bg-green-900" : ""
                }
              >
                {warehouse.name} (Normal: {warehouse.normal_capacity_kg}kg, Refrigerated:{" "}
                {warehouse.refrigerated_capacity_kg}kg)
                {warehouse.warehouse_id === recommendedWarehouse?.warehouse_id ? " ⭐ Recommended" : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Choose the warehouse where this product batch will be stored. Recommendations are based on your location and
            product requirements.
          </p>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Quantity (kg) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="quantity_kg"
            value={formData.quantity_kg || ""}
            onChange={handleInputChange}
            min="1"
            required
            className="w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter quantity in kilograms"
          />
          <p className="mt-1 text-xs text-gray-500">Total weight of this product batch in kilograms</p>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Quality Classification</label>

          {isClassifying && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-800 dark:text-blue-300">Analyzing image quality...</span>
              </div>
            </div>
          )}

          {qualityClassification && !isClassifying && (
            <div
              className={`p-3 border rounded-lg ${
                qualityClassification.classification === "GOOD"
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : qualityClassification.classification === "SUB_OPTIMAL" ||
                      qualityClassification.classification === "SUBOPTIMAL"
                    ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                    : qualityClassification.classification === "BAD"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      : qualityClassification.classification === "WRONG_PRODUCT"
                        ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                        : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
              }`}
            >
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                  qualityClassification.classification === "GOOD"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : qualityClassification.classification === "SUB_OPTIMAL" ||
                        qualityClassification.classification === "SUBOPTIMAL"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      : qualityClassification.classification === "BAD"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        : qualityClassification.classification === "WRONG_PRODUCT"
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                }`}
              >
                {qualityClassification.classification === "GOOD" && "✅ Good"}
                {(qualityClassification.classification === "SUB_OPTIMAL" ||
                  qualityClassification.classification === "SUBOPTIMAL") &&
                  "⚠️ Sub-optimal"}
                {qualityClassification.classification === "BAD" && "❌ Bad"}
                {qualityClassification.classification === "WRONG_PRODUCT" && "🔄 Wrong Product"}
                {!["GOOD", "SUB_OPTIMAL", "SUBOPTIMAL", "BAD", "WRONG_PRODUCT"].includes(
                  qualityClassification.classification
                ) && `❓ ${qualityClassification.classification}`}
              </span>
              <p
                className={`mt-1 text-xs ${
                  qualityClassification.classification === "GOOD"
                    ? "text-green-700 dark:text-green-400"
                    : qualityClassification.classification === "SUB_OPTIMAL" ||
                        qualityClassification.classification === "SUBOPTIMAL"
                      ? "text-yellow-700 dark:text-yellow-400"
                      : qualityClassification.classification === "BAD"
                        ? "text-red-700 dark:text-red-400"
                        : qualityClassification.classification === "WRONG_PRODUCT"
                          ? "text-orange-700 dark:text-orange-400"
                          : "text-gray-700 dark:text-gray-400"
                }`}
              >
                Quality automatically analyzed using AI image recognition
                {qualityClassification.classification === "BAD" && (
                  <span className="block mt-1 font-medium text-red-700 dark:text-red-400">
                    ⚠️ This product will be automatically marked as "Discarded" due to poor quality
                  </span>
                )}
              </p>
            </div>
          )}

          {!qualityClassification && !isClassifying && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                📷 Upload an image and select a product to analyze quality
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Product Image <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
            className="w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
          />
          <p className="mt-1 text-xs text-gray-500">
            <strong>Required:</strong> Upload an image of the product batch (max 5MB). Supported formats: JPEG, PNG,
            GIF, WebP
          </p>
          {formData.image_file && (
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <p className="text-sm text-green-800 dark:text-green-300">
                ✓ Image selected: {formData.image_file.name} ({(formData.image_file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">{error}</div>
        )}

        <div className="flex space-x-4 pt-4">
          <Button
            type="submit"
            color="primary"
            label={isSubmitting ? "Registering..." : isClassifying ? "Analyzing Quality..." : "Register Product Record"}
            onClick={() => {}}
            disabled={isSubmitting || isClassifying || !qualityClassification}
          />
          <Button
            type="button"
            color="secondary"
            label="Cancel"
            onClick={() => navigate("/supplier-product-records")}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
}
