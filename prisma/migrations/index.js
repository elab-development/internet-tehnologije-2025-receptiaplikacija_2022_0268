const express = require("express");
const bodyParser = require("body-parser");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const app = express();
const prisma = new PrismaClient();

app.use(bodyParser.json());
app.post("/register", async (req, res) => {
    const { ime, prezime, email, sifra, potvrdaSifre } = req.body;
  
   
    if (!ime || !prezime || !email || !sifra || !potvrdaSifre) {
      return res.status(400).json({ message: "Sva polja su obavezna" });
    }
  
    
    if (sifra !== potvrdaSifre) {
      return res.status(400).json({ message: "Sifre se ne poklapaju" });
    }
  
    try {
    
      const postoji = await prisma.user.findUnique({
        where: { email }
      });
  
      if (postoji) {
        return res.status(400).json({ message: "Email vec postoji" });
      }
  
      
      const hashedSifra = await bcrypt.hash(sifra, 10);
  

      const noviKorisnik = await prisma.user.create({
        data: {
          ime,
          prezime,
          email,
          sifra: hashedSifra
        }
      });
  
      res.status(201).json({
        message: "Uspesna registracija",
        korisnik: {
          id: noviKorisnik.id,
          email: noviKorisnik.email
        }
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Greska na serveru" });
    }
  });
  app.listen(3000, () => {
    console.log("Server radi na http://localhost:3000");
  });
    