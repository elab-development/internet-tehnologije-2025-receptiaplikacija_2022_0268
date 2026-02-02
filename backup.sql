--
-- PostgreSQL database dump
--

\restrict Wt131WbUS0FJem5Vegm0K50zFKIa25mlELNJvTnwJfPOtDK05VumpludIczl3WT

-- Dumped from database version 18.1 (Postgres.app)
-- Dumped by pg_dump version 18.1 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: phoneplanet
--

CREATE TYPE public."Role" AS ENUM (
    'KUPAC',
    'KUVAR',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO phoneplanet;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Cart; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."Cart" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Cart" OWNER TO phoneplanet;

--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."CartItem" (
    id text NOT NULL,
    "cartId" text NOT NULL,
    name text NOT NULL,
    quantity double precision NOT NULL,
    unit text NOT NULL
);


ALTER TABLE public."CartItem" OWNER TO phoneplanet;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."Category" OWNER TO phoneplanet;

--
-- Name: Favorite; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."Favorite" (
    "userId" text NOT NULL,
    "recipeId" text NOT NULL
);


ALTER TABLE public."Favorite" OWNER TO phoneplanet;

--
-- Name: Ingredient; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."Ingredient" (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."Ingredient" OWNER TO phoneplanet;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "userId" text NOT NULL,
    status text DEFAULT 'CREATED'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Order" OWNER TO phoneplanet;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    name text NOT NULL,
    quantity double precision NOT NULL,
    unit text NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO phoneplanet;

--
-- Name: Recipe; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."Recipe" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    difficulty integer NOT NULL,
    "prepTimeMinutes" integer NOT NULL,
    "imageUrl" text,
    "isPublished" boolean DEFAULT false NOT NULL,
    "authorId" text NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Recipe" OWNER TO phoneplanet;

--
-- Name: RecipeIngredient; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."RecipeIngredient" (
    "recipeId" text NOT NULL,
    "ingredientId" text NOT NULL,
    quantity double precision NOT NULL,
    unit text NOT NULL
);


ALTER TABLE public."RecipeIngredient" OWNER TO phoneplanet;

--
-- Name: Review; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    rating integer NOT NULL,
    comment text,
    "userId" text NOT NULL,
    "recipeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Review" OWNER TO phoneplanet;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Session" OWNER TO phoneplanet;

--
-- Name: Step; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."Step" (
    id text NOT NULL,
    "recipeId" text NOT NULL,
    "stepNumber" integer NOT NULL,
    text text NOT NULL
);


ALTER TABLE public."Step" OWNER TO phoneplanet;

--
-- Name: User; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    "passwordHash" text NOT NULL,
    role public."Role" DEFAULT 'KUPAC'::public."Role" NOT NULL,
    "isBlocked" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO phoneplanet;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: phoneplanet
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO phoneplanet;

--
-- Data for Name: Cart; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."Cart" (id, "userId", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."CartItem" (id, "cartId", name, quantity, unit) FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."Category" (id, name) FROM stdin;
\.


--
-- Data for Name: Favorite; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."Favorite" ("userId", "recipeId") FROM stdin;
\.


--
-- Data for Name: Ingredient; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."Ingredient" (id, name) FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."Order" (id, "userId", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."OrderItem" (id, "orderId", name, quantity, unit) FROM stdin;
\.


--
-- Data for Name: Recipe; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."Recipe" (id, title, description, difficulty, "prepTimeMinutes", "imageUrl", "isPublished", "authorId", "categoryId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RecipeIngredient; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."RecipeIngredient" ("recipeId", "ingredientId", quantity, unit) FROM stdin;
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."Review" (id, rating, comment, "userId", "recipeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."Session" (id, token, "userId", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Step; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."Step" (id, "recipeId", "stepNumber", text) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public."User" (id, email, name, "passwordHash", role, "isBlocked", "createdAt", "updatedAt") FROM stdin;
cmksgula30000gq52h51l6fwo	test@test.com	\N	$2b$10$wy63o0lBX6wvaZExudG7UOmVN3ppcNbbF3uwG1AkrVBmKDQiBAyEK	KUPAC	f	2026-01-24 15:30:10.872	2026-01-24 15:31:56.698
1	test9@test.com	\N	$2b$10$kl39RGTh2IrlJXOnB/SYF.N0V8MzSsyytw2Ru7EGrg/JD9sQWB/Yu	KUPAC	f	2026-01-23 23:49:27.7	2026-01-24 15:34:25.011
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: phoneplanet
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6d63c8db-4e87-42e2-b5a1-c030853529f3	c8d05d55872ad76ca9595bda0cdd194b0b268568642d9bf21ff1c00a54d152aa	2026-01-23 18:16:43.485105+01	20260123171643_init	\N	\N	2026-01-23 18:16:43.41857+01	1
\.


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Cart Cart_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Favorite Favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId", "recipeId");


--
-- Name: Ingredient Ingredient_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Ingredient"
    ADD CONSTRAINT "Ingredient_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: RecipeIngredient RecipeIngredient_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."RecipeIngredient"
    ADD CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("recipeId", "ingredientId");


--
-- Name: Recipe Recipe_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Recipe"
    ADD CONSTRAINT "Recipe_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Step Step_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Step"
    ADD CONSTRAINT "Step_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: CartItem_cartId_idx; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE INDEX "CartItem_cartId_idx" ON public."CartItem" USING btree ("cartId");


--
-- Name: Cart_userId_key; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE UNIQUE INDEX "Cart_userId_key" ON public."Cart" USING btree ("userId");


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: Favorite_recipeId_idx; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE INDEX "Favorite_recipeId_idx" ON public."Favorite" USING btree ("recipeId");


--
-- Name: Ingredient_name_key; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE UNIQUE INDEX "Ingredient_name_key" ON public."Ingredient" USING btree (name);


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: Order_userId_idx; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE INDEX "Order_userId_idx" ON public."Order" USING btree ("userId");


--
-- Name: RecipeIngredient_ingredientId_idx; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE INDEX "RecipeIngredient_ingredientId_idx" ON public."RecipeIngredient" USING btree ("ingredientId");


--
-- Name: Recipe_authorId_idx; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE INDEX "Recipe_authorId_idx" ON public."Recipe" USING btree ("authorId");


--
-- Name: Recipe_categoryId_idx; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE INDEX "Recipe_categoryId_idx" ON public."Recipe" USING btree ("categoryId");


--
-- Name: Recipe_isPublished_idx; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE INDEX "Recipe_isPublished_idx" ON public."Recipe" USING btree ("isPublished");


--
-- Name: Review_recipeId_idx; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE INDEX "Review_recipeId_idx" ON public."Review" USING btree ("recipeId");


--
-- Name: Review_userId_recipeId_key; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE UNIQUE INDEX "Review_userId_recipeId_key" ON public."Review" USING btree ("userId", "recipeId");


--
-- Name: Session_token_key; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE UNIQUE INDEX "Session_token_key" ON public."Session" USING btree (token);


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: Step_recipeId_idx; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE INDEX "Step_recipeId_idx" ON public."Step" USING btree ("recipeId");


--
-- Name: Step_recipeId_stepNumber_key; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE UNIQUE INDEX "Step_recipeId_stepNumber_key" ON public."Step" USING btree ("recipeId", "stepNumber");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: phoneplanet
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: CartItem CartItem_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public."Cart"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Cart Cart_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Favorite Favorite_recipeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES public."Recipe"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Favorite Favorite_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecipeIngredient RecipeIngredient_ingredientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."RecipeIngredient"
    ADD CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES public."Ingredient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecipeIngredient RecipeIngredient_recipeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."RecipeIngredient"
    ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES public."Recipe"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Recipe Recipe_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Recipe"
    ADD CONSTRAINT "Recipe_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Recipe Recipe_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Recipe"
    ADD CONSTRAINT "Recipe_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_recipeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES public."Recipe"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Step Step_recipeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: phoneplanet
--

ALTER TABLE ONLY public."Step"
    ADD CONSTRAINT "Step_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES public."Recipe"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Wt131WbUS0FJem5Vegm0K50zFKIa25mlELNJvTnwJfPOtDK05VumpludIczl3WT

