import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "~/components/Button";

// Mock data (replace with API later)
const mockBudgets: any = [
  { id: 1, name: 'Apple MacBook Pro 17"', date: "2025-01-10", owner: "Alice", fileUrl: null },
  { id: 2, name: "Microsoft Surface Pro", date: "2025-02-15", owner: "Bob", fileUrl: null },
  { id: 3, name: "Magic Mouse 2", date: "2025-03-01", owner: "Charlie", fileUrl: null },
  { id: 4, name: "Google Pixel Phone", date: "2025-04-20", owner: "Dana", fileUrl: null },
  { id: 5, name: "Apple Watch 5", date: "2025-05-05", owner: "Eve", fileUrl: null },
  { id: 6, name: "Quarterly Report", date: "2025-06-01", owner: "Finance Dept", fileUrl: "/mock-file.pdf" },
];

export function EditBudget() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    owner: "",
    file: null as File | null,
  });

  useEffect(() => {
    // Load mock budget (replace with API fetch later)
    const budget = mockBudgets.find((b: any) => b.id === Number(id));
    if (budget) {
      setFormData({
        name: budget.name,
        date: budget.date,
        owner: budget.owner,
        file: null, // placeholder, file upload is separate
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "file" && files) {
      setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call to update budget
    console.log("Updating budget:", formData);
    navigate("/budgets");
  };

  return (
    <div className="px-28 pt-14">
      <h1 className="text-4xl font-bold mb-6">Edit Budget</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
        <div>
          <label className="block mb-2 text-sm font-medium">Product Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Owner</label>
          <input
            type="text"
            name="owner"
            value={formData.owner}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-lg"
          />
        </div>

        {/* <div>
          <label className="block mb-2 text-sm font-medium">Replace File</label>
          <input type="file" name="file" onChange={handleChange} className="w-full" />
        </div> */}

        <div className="flex space-x-4">
          <Button type="submit" color="primary" label="Update" onClick={() => {}} />
          <Button type="button" color="secondary" label="Cancel" onClick={() => navigate("/budgets")} />
        </div>
      </form>
    </div>
  );
}
