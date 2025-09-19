O python no Windows é meio cagado então recomendo usarem WSL.
Se tão num Linux, Mac ou já sabem usar WSL passem esta parte.

Abram a Microsoft Store e instalem um Ubuntu qqlr deve de haver por lá um Ubuntu 22.04 ou 24.04
Depois disso quando abrirem o terminal é só escrever 
```bash
wsl
```
e aquilo abre o terminal no wsl. Aquilo espelha o vosso PC mas num OS em condições.

A Forma como o Python lida com dependencias e bibliotecas é uma porcaria e muito facilmente têm problemas com isso então recomendo usarem virtual environments para tal. Aquilo basicamente cria um clone do python numa pasta e vocês podem dizer ao vosso pra usar esse Python e assim sempre que instalarem bibliotecas fica só nessa pasta e não rebenta o vosso PC.
Para criar um virtual environment façam o seguinte:
```bash
cd /diretoria/do/projeto/ou/modulo/
python3 -m venv venv
```
(o primeiro `venv` é a dizer que querem criar um virtual environment o segundo é o nome da pasta. Podem alterar o segundo. Às vezes a malta gosta de por `.venv` para ficar escondido mas eu gosto que fique visivel)

Para usar o virtual environment que criaram façam
```bash
./venv/bin/activate
```

quando vocês ativam em principio o vosso terminal mostra isso logo no inicio. Exemplo:
```bash
(venv) joao@DESKTOP-RT8E91W:/mnt/c/Users/olive/Desktop/cenaDaSupplyChain/$ ls
README.md  backend  db  docker compose.yml  ia  python101.md  ui
```

E agora para instalarem as dependencias do projeto façam na diretoria correta

```bash
pip install -r requirements.txt
```
