Recepti Aplikacija

Recepti Aplikacija je web aplikacija razvijena u Next.js okruženju koja omogućava korisnicima pregled, kupovinu i upravljanje receptima i sastojcima. Aplikacija podržava više korisničkih uloga (Kupac, Kuvar, Admin), premium recepte, korpu za sastojke, kao i integraciju sa eksternim API servisima. Projekat je razvijen u okviru predmeta Internet Tehnologije.

⸻

Funkcionalnosti aplikacije

Aplikacija omogućava:                                                                     
	•	Registraciju i prijavu korisnika                                                  
	•	Različite korisničke uloge (Kupac, Kuvar, Admin)                                  
	•	Pregled svih objavljenih recepata                                                 
	•	Pretragu i filtriranje recepata po kategorijama                                   
	•	Prikaz detalja recepta (opis, sastojci, koraci, recenzije)                        
	•	Dodavanje recepata u omiljene (samo prijavljeni korisnici)                        
	•	Ocenjivanje i ostavljanje recenzija (samo prijavljeni korisnici)                  
	•	Kupovinu premium recepata (samo prijavljeni kupci)                                
	•	Kupovinu sastojaka i rad sa korpom (samo prijavljeni kupci)                       
	•	Admin panel za upravljanje korisnicima i receptima                                
	•	Kuvar panel za kreiranje i upravljanje sopstvenim receptima                       

⸻

Eksterni API servisi                                                                      
                                                                                          
Aplikacija koristi dva eksterna API servisa:                                              
	1.	Meal of the Day (TheMealDB API) – koristi se za prikaz nasumičnog recepta dana na stranici sa receptima.                                                                
	2.	API za nutritivne vrednosti – omogućava prikaz kalorijskih i nutritivnih vrednosti određenih sastojaka.                                                        

⸻

Tehnologije

U projektu su korišćene sledećih tehnologije:                                             
	•	Next.js                                                                           
	•	TypeScript                                                                        
	•	Prisma ORM                                                                        
	•	PostgreSQL                                                                        
	•	Docker i Docker Compose                                                           
	•	Tailwind CSS                                                                      

⸻

Pokretanje aplikacije – Lokalno (bez Docker-a)

1.	Instalirati zavisnosti:
npm install

2.	Generisati Prisma klijenta:
npx prisma generate

3.	Pokrenuti migracije baze:
npx prisma migrate dev 

4.	Pokrenuti aplikaciju:
npm run dev

Aplikacija će biti dostupna na adresi:

http://localhost:3000

⸻

Pokretanje aplikacije – Docker
1.	Pokrenuti kontejnere: docker compose up –build

2.	U drugom terminalu pokrenuti migracije: docker compose exec web npx prisma migrate deploy

Aplikacija će gbiti dostupna na adresi:

http://localhost:3000

Za gašenje kontejnera koristiti: docker compose down

⸻

Napomena

Za rad aplikacije neophodno je da je PostgreSQL baza pokrenuta (lokalno ili u Docker kontejneru, u zavisnosti od načina pokretanja).

## Development grana

Ova grana služi za razvoj i integraciju novih funkcionalnosti pre spajanja u main granu. 
Sve izmene i nove funkcionalnosti se prvo razvijaju i testiraju u develop grani.