import pandas as pd

# Load the Excel file
df = pd.read_excel("Listagem_entidades_autorizadas_a_beneficiar_da_consignacao_2024.xlsx")

# Save as CSV
df.to_csv("entidades.csv", index=False, encoding="utf-8")
