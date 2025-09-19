import { useState } from "react";
import { useNavigate } from "react-router";
import Button from "~/components/Button";

export function CreateBudget() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    owner: "",
    file: null as File | null,
  });

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
    // TODO: API call to save new budget
    console.log("Creating budget:", formData);
    navigate("/budgets"); // back to list
  };

  return (
    <div className="px-28 pt-14">
      <h1 className="text-4xl font-bold mb-6">Create Budget</h1>
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

        <div>
          <label className="block mb-2 text-sm font-medium">Upload File</label>
          <input type="file" name="file" onChange={handleChange} className="w-full" />
        </div>

        <div className="flex space-x-4">
          <Button type="submit" color="primary" label="Save" onClick={() => {}} />
          <Button type="button" color="secondary" label="Cancel" onClick={() => navigate("/budgets")} />
        </div>
      </form>
    </div>
  );
}
