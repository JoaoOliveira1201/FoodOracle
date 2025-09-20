import { useState } from "react";
import Button from "~/components/Button";

interface Product {
  product_id: number;
  name: string;
}

interface QuoteSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  supplierId: number;
  onSuccess: (message: string) => void;
}

export function QuoteSubmissionModal({ 
  isOpen, 
  onClose, 
  product, 
  supplierId, 
  onSuccess 
}: QuoteSubmissionModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      // Validate file type (PDF only)
      if (files[0].type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        return;
      }
      
      // Validate file size (max 10MB)
      if (files[0].size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB.");
        return;
      }
      
      setError("");
      setFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("PDF document is required for quote submission.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('supplier_id', supplierId.toString());
      formData.append('product_id', product.product_id.toString());
      formData.append('status', 'Pending');
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/quotes/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit quote');
      }

      const result = await response.json();
      
      // Success - close modal and show success message
      handleClose();
      onSuccess(`Quote submitted successfully for ${product.name}! Quote ID: ${result.quote_id}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quote");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Submit Quote</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Submitting Quote For:</p>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{product.name}</p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Requirements</h3>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            A PDF document is <strong>required</strong> and should include pricing details, certifications, or product specifications.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Quote Document <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              required
              className="w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
            />
            <p className="mt-1 text-xs text-gray-500">
              Upload a PDF document with your quote information (max 10MB)
            </p>
            {file && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <p className="text-sm text-green-800 dark:text-green-300">
                  ✓ File selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-md">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              color="primary"
              label={isLoading ? "Submitting..." : "Submit Quote"}
              onClick={() => {}}
              disabled={isLoading}
            />
            <Button
              type="button"
              color="secondary"
              label="Cancel"
              onClick={handleClose}
              disabled={isLoading}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
