"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import type { Organization } from "@/types";
import AnimatedCounter from "@/components/motion/AnimatedCounter";
import FadeIn from "@/components/motion/FadeIn";
import StaggerContainer from "@/components/motion/StaggerContainer";
import StaggerItem from "@/components/motion/StaggerItem";
import AnimatedButton from "@/components/ui/AnimatedButton";
import {
  ArrowRight,
  UserPlus,
  ClipboardCheck,
  MessageCircle,
  Building2,
  Users,
  Sprout,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  LineChart,
  Globe2,
  Quote,
  Leaf,
  Factory,
  Truck,
  BadgeCheck,
} from "lucide-react";

const HOME_HERO_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/f/f3/Pineapple_market%2C_Jalchatra%2C_Tangail.jpg";

/* ------------------------------------------------------------------ */
/*  Hero title words – "ananas" rendered in green                     */
/* ------------------------------------------------------------------ */
const heroWords = [
  "Commercialisez",
  "vos",
  "ananas",
  "en",
  "toute",
  "simplicite",
];

/* ------------------------------------------------------------------ */
/*  How-it-works steps                                                */
/* ------------------------------------------------------------------ */
const steps = [
  {
    num: 1,
    Icon: UserPlus,
    title: "Inscrivez-vous",
    desc: "Creez votre compte en tant que producteur ou acheteur",
  },
  {
    num: 2,
    Icon: ClipboardCheck,
    title: "Publiez ou consultez",
    desc: "Les producteurs publient leurs stocks, les acheteurs consultent",
  },
  {
    num: 3,
    Icon: MessageCircle,
    title: "Contactez directement",
    desc: "Echangez via WhatsApp pour finaliser vos transactions",
  },
];

const highlights = [
  {
    icon: LineChart,
    title: "Prix plus transparents",
    description: "Visualisez rapidement les prix du marche et negociez avec plus de confiance.",
  },
  {
    icon: ShieldCheck,
    title: "Flux de validation fiable",
    description: "Chaque annonce suit un circuit de validation clair pour renforcer la credibilite.",
  },
  {
    icon: Globe2,
    title: "Portails par organisation",
    description: "Chaque federation ou reseau dispose d'un espace dedie pour piloter ses membres.",
  },
];

const testimonials = [
  {
    quote: "Nous avons reduit le delai de vente en centralisant les annonces sur TOHUTOU.",
    author: "Union Producteurs - Atlantique",
  },
  {
    quote: "L'interface est claire, rapide et efficace pour negocier entre acheteurs et producteurs.",
    author: "Reseau des acheteurs locaux",
  },
];

const pineappleVarieties = [
  {
    name: "Pain de sucre",
    profile: "Chair blanche, gout doux et faible acidite.",
    market: "Tres demande sur les circuits locaux et premium.",
  },
  {
    name: "Cayenne lisse",
    profile: "Format regulier, adaptee a la transformation.",
    market: "Ideale pour jus, sechage et export agro-industriel.",
  },
  {
    name: "MD2",
    profile: "Calibre homogene, bonne tenue post-recolte.",
    market: "Reference pour les standards internationaux.",
  },
];

const valueChain = [
  {
    icon: Leaf,
    title: "Production tracee",
    text: "Chaque lot est rattache a son producteur, sa cooperative et son organisation.",
  },
  {
    icon: Factory,
    title: "Transformation facilitee",
    text: "Les transformateurs identifient rapidement les lots compatibles avec leurs besoins.",
  },
  {
    icon: Truck,
    title: "Distribution acceleree",
    text: "Les acheteurs consultent les volumes disponibles et prennent contact sans friction.",
  },
];

/* ================================================================== */
/*  PAGE COMPONENT                                                    */
/* ================================================================== */
export default function Home() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  useEffect(() => {
    api
      .get<Organization[]>("/organizations")
      .then((r) => setOrgs(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* ========================================================== */}
      {/*  HEADER                                                    */}
      {/* ========================================================== */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/70 backdrop-blur-xl shadow-sm border-b border-gray-100/60"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-extrabold tracking-tight text-green-700">
              TOHUTOU
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/announcements"
              className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors"
            >
              Annonces
            </Link>
            <Link href="/login">
              <AnimatedButton variant="primary" className="px-6 py-2 text-sm">
                Connexion
              </AnimatedButton>
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="w-5 h-5 text-gray-700" />
            ) : (
              <Menu className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile slide-in menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden overflow-hidden bg-white/90 backdrop-blur-xl border-b border-gray-100"
            >
              <div className="px-4 py-4 flex flex-col gap-3">
                <Link
                  href="/announcements"
                  className="text-sm font-medium text-gray-700 hover:text-green-700 transition-colors py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  Annonces
                </Link>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <AnimatedButton
                    variant="primary"
                    className="w-full py-2.5 text-sm"
                  >
                    Connexion
                  </AnimatedButton>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        {/* ========================================================== */}
        {/*  HERO                                                      */}
        {/* ========================================================== */}
        <section className="relative overflow-hidden bg-linear-to-b from-[#ecf8e8] via-[#f8fbf4] to-white pt-20 sm:pt-24">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-24 top-8 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl" />
            <div className="absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-lime-200/35 blur-3xl" />
            <div className="absolute bottom-12 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-200/25 blur-3xl" />
          </div>

          <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-white/75 px-4 py-1.5 text-xs font-semibold text-emerald-800 backdrop-blur-sm">
                    <Sprout className="h-3.5 w-3.5" />
                    Plateforme de la filiere ananas au Benin
                  </span>
                </motion.div>

                <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  {heroWords.map((word, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.45,
                        delay: 0.15 + i * 0.08,
                        ease: "easeOut",
                      }}
                      className={`mr-[0.3em] inline-block ${word === "ananas" ? "text-emerald-600" : ""}`}
                    >
                      {word}
                    </motion.span>
                  ))}
                </h1>

                <FadeIn delay={0.38} className="mt-5">
                  <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                    TOHUTOU met l&apos;ananas au centre: visibilite des lots, validation claire par organisation
                    et contact rapide entre producteurs, acheteurs et transformateurs.
                  </p>
                </FadeIn>

                <FadeIn delay={0.5} className="mt-6">
                  <div className="flex flex-wrap justify-center gap-2.5 lg:justify-start">
                    {["Pain de sucre", "Cayenne lisse", "MD2"].map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-xs font-semibold text-emerald-800"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </FadeIn>

                <FadeIn delay={0.62} className="mt-8">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/register">
                      <AnimatedButton
                        variant="primary"
                        className="px-8 py-3 text-sm shadow-lg shadow-green-700/20 sm:text-base"
                      >
                        Rejoindre la plateforme
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </AnimatedButton>
                    </Link>
                    <Link href="/announcements">
                      <AnimatedButton variant="secondary" className="px-8 py-3 text-sm sm:text-base">
                        Voir les annonces
                      </AnimatedButton>
                    </Link>
                  </div>
                </FadeIn>

                <FadeIn delay={0.72} className="mt-7 w-full">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/70 bg-white/85 p-3.5 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Objectif</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">Rendre les lots d&apos;ananas visibles et negocies rapidement</p>
                    </div>
                    <div className="rounded-2xl border border-white/70 bg-white/85 p-3.5 shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Confiance</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">Validation delegate/administrateur selon votre organisation</p>
                    </div>
                  </div>
                </FadeIn>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
                className="rounded-[2rem] border border-white/60 bg-gradient-to-br from-emerald-900/95 via-green-800/95 to-lime-700/90 p-4 shadow-2xl shadow-emerald-950/30 sm:p-6"
              >
                <div className="rounded-3xl border border-white/25 bg-white/10 p-2.5 backdrop-blur-sm sm:p-4">
                  <div className="relative h-80 w-full overflow-hidden rounded-2xl sm:h-[420px] lg:h-[520px]">
                    <Image
                      src={HOME_HERO_IMAGE}
                      alt="Ananas frais sur etalage"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 45vw"
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/55 via-emerald-900/10 to-transparent" />
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/25 bg-white/10 p-3 text-white backdrop-blur-sm">
                    <p className="text-[11px] uppercase tracking-wider text-white/70">Qualite</p>
                    <p className="mt-1 text-sm font-semibold">Lots suivis</p>
                  </div>
                  <div className="rounded-xl border border-white/25 bg-white/10 p-3 text-white backdrop-blur-sm">
                    <p className="text-[11px] uppercase tracking-wider text-white/70">Flux</p>
                    <p className="mt-1 text-sm font-semibold">Validation rapide</p>
                  </div>
                  <div className="rounded-xl border border-white/25 bg-white/10 p-3 text-white backdrop-blur-sm">
                    <p className="text-[11px] uppercase tracking-wider text-white/70">Marche</p>
                    <p className="mt-1 text-sm font-semibold">Vitrine en direct</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/*  STATS                                                     */}
        {/* ========================================================== */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.12 } },
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              {[
                {
                  icon: Building2,
                  value: 9,
                  suffix: "",
                  label: "Organisations",
                },
                {
                  icon: Users,
                  value: 41,
                  suffix: "+",
                  label: "Cooperatives",
                },
                {
                  icon: Sprout,
                  value: 2500,
                  suffix: "+",
                  label: "Producteurs",
                },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, ease: "easeOut" },
                    },
                  }}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-green-700" />
                  </div>
                  <AnimatedCounter
                    to={stat.value}
                    suffix={stat.suffix}
                    className="text-3xl sm:text-4xl font-bold text-gray-900"
                  />
                  <span className="text-sm text-gray-500 font-medium">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========================================================== */}
        {/*  PINEAPPLE FOCUS                                           */}
        {/* ========================================================== */}
        <section className="relative overflow-hidden py-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-0 top-1/3 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
            <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-emerald-200/35 blur-3xl" />
          </div>

          <div className="relative mx-auto w-full max-w-6xl space-y-10 px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                L&apos;ananas du Benin en vitrine
              </h2>
              <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Le home explique clairement les varietes, la chaine de valeur et la preuve de qualite
                pour convaincre rapidement partenaires, acheteurs et membres des organisations.
              </p>
            </FadeIn>

            <div className="grid gap-5 lg:grid-cols-3">
              {pineappleVarieties.map((variety, index) => (
                <FadeIn key={variety.name} delay={index * 0.1}>
                  <motion.article
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="h-full rounded-3xl border border-amber-100 bg-gradient-to-b from-white to-amber-50/70 p-6 shadow-sm"
                  >
                    <div className="mb-4 inline-flex rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-700">
                      Variete
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-slate-900">{variety.name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{variety.profile}</p>
                    <p className="mt-3 text-sm font-medium leading-relaxed text-emerald-800">{variety.market}</p>
                  </motion.article>
                </FadeIn>
              ))}
            </div>

            <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-lg shadow-emerald-950/5 sm:p-7 lg:grid-cols-3">
              {valueChain.map((item, index) => (
                <FadeIn key={item.title} delay={0.1 + index * 0.08}>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn>
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-green-700 to-lime-700 p-6 text-white shadow-xl shadow-emerald-950/20 sm:p-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-2xl">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Positionnement premium
                    </p>
                    <h3 className="mt-3 text-xl font-semibold sm:text-2xl">
                      Une image de plateforme serieuse, moderne et orientee business
                    </h3>
                    <p className="mt-2 text-sm text-white/85 sm:text-base">
                      Ton projet montre des ecrans convaincants pour une fin de formation et une future mise
                      en production avec des partenaires.
                    </p>
                  </div>
                  <Link href="/announcements" className="shrink-0">
                    <AnimatedButton
                      variant="secondary"
                      className="border-white bg-white text-emerald-700 hover:bg-emerald-50"
                    >
                      Explorer le marche
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </AnimatedButton>
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ========================================================== */}
        {/*  HIGHLIGHTS + TESTIMONIALS                                 */}
        {/* ========================================================== */}
        <section className="py-16 sm:py-20 bg-linear-to-b from-white to-emerald-50/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <FadeIn className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Une plateforme pensée pour convaincre
              </h2>
              <p className="mt-3 text-gray-500 max-w-2xl mx-auto">
                Design premium, parcours fluide et outils concrets pour faire avancer la filiere.
              </p>
            </FadeIn>

            <div className="grid lg:grid-cols-3 gap-5">
              {highlights.map((item, idx) => (
                <FadeIn key={item.title} delay={idx * 0.08}>
                  <motion.article
                    whileHover={{ y: -5, scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    className="h-full rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                      <item.icon className="w-5 h-5 text-emerald-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.description}</p>
                  </motion.article>
                </FadeIn>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {testimonials.map((item, idx) => (
                <FadeIn key={item.author} delay={0.12 + idx * 0.08}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                  >
                    <Quote className="w-5 h-5 text-emerald-500 mb-3" />
                    <p className="text-sm text-gray-700 leading-relaxed">{item.quote}</p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      {item.author}
                    </p>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/*  ORGANISATIONS                                             */}
        {/* ========================================================== */}
        {orgs.length > 0 && (
          <section className="py-16 sm:py-20 bg-gray-50/70">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <FadeIn className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Nos organisations
                </h2>
                <p className="mt-3 text-gray-500 max-w-xl mx-auto">
                  Accedez au portail de votre organisation pour gerer vos
                  annonces et activites
                </p>
              </FadeIn>

              <StaggerContainer
                staggerDelay={0.1}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {orgs.map((org) => (
                  <StaggerItem key={org.id}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="group"
                    >
                      <Link
                        href={`/org/${org.slug}`}
                        className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:border-gray-200 transition-shadow h-full"
                      >
                        {/* Org header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
                            style={{
                              backgroundColor: org.primary_color,
                            }}
                          >
                            {org.logo_url ? (
                              <Image
                                src={org.logo_url}
                                alt={org.name}
                                width={44}
                                height={44}
                                unoptimized
                                className="w-11 h-11 rounded-xl object-cover"
                              />
                            ) : (
                              org.name[0]
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                            {org.name}
                          </h3>
                        </div>

                        {/* Description */}
                        {org.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                            {org.description}
                          </p>
                        )}

                        {/* Link */}
                        <div
                          className="flex items-center gap-1 text-sm font-medium"
                          style={{ color: org.primary_color }}
                        >
                          Acceder au portail
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </section>
        )}

        {/* ========================================================== */}
        {/*  HOW IT WORKS                                              */}
        {/* ========================================================== */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Comment ca marche ?
              </h2>
              <p className="mt-3 text-gray-500 max-w-xl mx-auto">
                En 3 etapes simples, accedez au marche de l&apos;ananas
              </p>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step) => (
                <FadeIn key={step.num} delay={step.num * 0.15}>
                  <div className="relative text-center p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    {/* Step number badge */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-br from-green-600 to-green-700 text-white text-sm font-bold shadow-md shadow-green-700/20">
                        {step.num}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mt-2 mb-5">
                      <step.Icon className="w-7 h-7 text-green-700" />
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/*  CTA                                                       */}
        {/* ========================================================== */}
        <section className="relative py-16 sm:py-20 bg-linear-to-br from-emerald-800 via-green-700 to-lime-700 overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 top-8 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute right-0 bottom-0 w-72 h-72 rounded-full bg-lime-200/20 blur-3xl" />
          </div>

          <FadeIn className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="rounded-3xl border border-white/25 bg-white/10 px-6 py-10 backdrop-blur"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Pret a rejoindre la plateforme ?
              </h2>
              <p className="text-green-100 mb-8 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                Que vous soyez producteur ou acheteur, TOHUTOU facilite vos
                echanges sur le marche de l&apos;ananas au Benin.
              </p>
              <Link href="/register">
                <AnimatedButton
                  variant="secondary"
                  className="bg-white text-green-700 border-white hover:bg-green-50 px-8 py-3 text-sm sm:text-base shadow-lg"
                >
                  Creer mon compte
                  <ArrowRight className="w-4 h-4 ml-1" />
                </AnimatedButton>
              </Link>
            </motion.div>
          </FadeIn>
        </section>
      </main>

      {/* ========================================================== */}
      {/*  FOOTER                                                    */}
      {/* ========================================================== */}
      <FadeIn>
        <footer className="bg-gray-900 text-gray-400 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p>&copy; 2026 TOHUTOU - Plateforme Ananas du Benin</p>
            <div className="flex gap-6">
              <Link
                href="/announcements"
                className="hover:text-white transition-colors"
              >
                Annonces
              </Link>
              <Link
                href="/register"
                className="hover:text-white transition-colors"
              >
                Inscription
              </Link>
              <Link
                href="/login"
                className="hover:text-white transition-colors"
              >
                Connexion
              </Link>
            </div>
          </div>
        </footer>
      </FadeIn>
    </div>
  );
}
