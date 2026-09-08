/**
 * Goldenplac - Store de Datos Centralizado
 * Gestiona el estado de la web, sincronización en tiempo real con LocalStorage,
 * y persistencia entre la web pública y el Panel de Administración.
 */

const STORAGE_KEY = 'goldenplac_database_v6';

const DEFAULT_DATA = {
  company: {
    name: 'Goldenplac SL',
    cif: 'B21844873',
    slogan: 'Especialistas en Pladur y Reformas Integrales en Madrid',
    phone: '+34 634 28 34 51',
    phoneRaw: '+34634283451',
    whatsapp: '34634283451',
    email: 'goldenplac.sl@gmail.com',
    address: 'Calle de Humera, 14, 28945 Fuenlabrada, Madrid',
    googleMapsUrl: 'https://www.google.com/maps/place/Goldenplac/@40.2854359,-3.798811,16z/data=!4m6!3m5!1s0xd418b006727ba15:0x4c9851d81ee05896!8m2!3d40.2860375!4d-3.7960108!16s%2Fg%2F11z3y9ngcg?entry=ttu',
    schedule: 'Lunes a Viernes: 08:00 - 19:00 | Sábados: 09:00 - 14:00',
    heroBadge: 'Líderes en Pladur en la Comunidad de Madrid',
    heroTitle: 'Tabiques, Techos de Pladur y Reformas con Acabado de Lujo',
    heroSubtitle: 'Diseñamos y ejecutamos falsos techos con foseados de luz indirecta LED, tabiquería insonorizada, muebles a medida y reformas llave en mano con presupuesto gratis en 24h.',
    trustBadges: [
      'Presupuesto gratis en 24h',
      'Visita técnica sin coste ni compromiso',
      'Materiales certificados Pladur® y Knauf',
      'Garantía por escrito en cada obra'
    ]
  },
  services: [
    {
      id: 'techos-led',
      title: 'Falsos Techos Continuos y Foseados LED',
      category: 'Techos',
      tag: 'Especialidad Estrella',
      description: 'Montaje de techos lisos y foseados perimetrales con iluminación indirecta LED cálida. Creación de candilejas, candelabros de pladur y techos acústicos desmontables.',
      deliveryTime: 'Desde 48h de ejecución',
      priceEstimate: '28 - 45 €/m²',
      image: 'assets/images/techos-led.jpg',
      features: ['Luz indirecta LED difusa', 'Aislamiento acústico lana de roca', 'Acabado liso Q4 sin imperfecciones']
    },
    {
      id: 'tabiques-trasdosados',
      title: 'Tabiques y Trasdosados de Pladur',
      category: 'Tabiques',
      tag: 'Más Solicitado',
      description: 'División rápida y limpia de estancias con perfilería de acero galvanizado y placas de yeso laminado. Trasdosados autoportantes o pegados para aislar paredes frías.',
      deliveryTime: 'Rápido, limpio y sin escombros',
      priceEstimate: '32 - 48 €/m²',
      image: 'assets/images/hero-bg.jpg',
      features: ['Estructura galvanizada reforzada', 'Aislamiento térmico integrado', 'Resistencia para colgar muebles pesados']
    },
    {
      id: 'muebles-pladur',
      title: 'Muebles de TV, Librerías y Hornacinas',
      category: 'Muebles',
      tag: 'Diseño Exclusivo',
      description: 'Paredes de TV modernas con pasacables totalmente oculto, hornacinas retroiluminadas con tiras LED, librerías empotradas y cabeceros arquitectónicos a medida.',
      deliveryTime: 'Proyecto a medida 3-5 días',
      priceEstimate: 'Desde 450 € proyecto',
      image: 'assets/images/mueble-tv.jpg',
      features: ['Cero cables visibles', 'Hornacinas decorativas con LED', 'Integración de chimeneas de bioetanol']
    },
    {
      id: 'aislamiento-acustico',
      title: 'Insonorización y Aislamiento Acústico/Térmico',
      category: 'Aislamiento',
      tag: 'Confort Total',
      description: 'Sistemas certificados para eliminar ruidos molestos de vecinos o de la calle. Combinamos membranas acústicas de alta densidad y lana de roca mineral.',
      deliveryTime: 'Solución certificada dB',
      priceEstimate: '42 - 65 €/m²',
      image: 'assets/images/techos-led.jpg',
      features: ['Atenuación hasta 55dB', 'Ahorro energético en calefacción', 'Sin puentes acústicos']
    },
    {
      id: 'reformas-integrales',
      title: 'Reformas Integrales de Pisos y Locales',
      category: 'Reformas',
      tag: 'Llave en Mano',
      description: 'Renovación completa de viviendas en Madrid: demolición, nueva distribución de pladur, fontanería, electricidad, alicatado, carpintería y pintura final.',
      deliveryTime: 'Plazo cerrado garantizado',
      priceEstimate: 'Desde 420 €/m²',
      image: 'assets/images/hero-bg.jpg',
      features: ['Jefe de obra asignado', 'Gestión de licencias en ayuntamiento', 'Entrega con limpieza profesional']
    },
    {
      id: 'placas-hidrofugas-fuego',
      title: 'Placas Hidrófugas y Protección Contra Fuego',
      category: 'Especiales',
      tag: 'Técnico Homologado',
      description: 'Instalación de placas verdes antihumedad para baños y cocinas, y placas rosas cortafuegos para garajes, locales comerciales y sectorización según CTE.',
      deliveryTime: 'Cumplimiento normativo',
      priceEstimate: '35 - 55 €/m²',
      image: 'assets/images/techos-led.jpg',
      features: ['Resistencia al vapor de agua', 'Certificación EI30 a EI120', 'Tratamiento fungicida']
    }
  ],
  projects: [
    {
      id: 1,
      title: 'Falso Techo Continuo con Luz Indirecta LED',
      category: 'Techos',
      location: 'Barrio de Salamanca, Madrid',
      description: 'Montaje de techo suspendido con foseado perimetral para candileja LED cálida en salón principal. Acabado de juntas Q4 liso perfecto.',
      image: 'img/falso-techo-recien-montado.mKmm81ID_ZG1BbR.webp',
      afterImage: 'img/falso-techo-recien-montado.mKmm81ID_ZG1BbR.webp',
      duration: '4 días',
      year: '2026'
    },
    {
      id: 2,
      title: 'Reforma de Baño de Lujo con Hornacina en Travertino',
      category: 'Reformas',
      location: 'Pozuelo de Alarcón, Madrid',
      description: 'Construcción con placas hidrófugas antihumedad, hornacina iluminada para ducha y revestimiento continuo en travertino pulido.',
      image: 'img/bano-ducha-travertino.qpW4YUMO_ZuDMfc.webp',
      afterImage: 'img/bano-ducha-travertino.qpW4YUMO_ZuDMfc.webp',
      duration: '8 días',
      year: '2026'
    },
    {
      id: 3,
      title: 'Nivelación Láser de Estructura de Techo',
      category: 'Techos',
      location: 'Chamberí, Madrid',
      description: 'Replanteo y montaje milimétrico de perfilería TC47 mediante nivel láser para techos suspendidos sin la más mínima desviación.',
      image: 'img/falso-techo-estructura-laser.DVKOl4RW_1XmsUU.webp',
      afterImage: 'img/falso-techo-estructura-laser.DVKOl4RW_1XmsUU.webp',
      duration: '2 días',
      year: '2026'
    },
    {
      id: 4,
      title: 'Trasdosado Hidrófugo y Mueble Suspendido Doble Lavabo',
      category: 'Reformas',
      location: 'Las Rozas, Madrid',
      description: 'Estructura reforzada en pladur hidrófugo para soportar mueble flotante de doble seno con grifería encastrada y espejo retroiluminado.',
      image: 'img/bano-doble-lavabo.DyU1DUkJ_Znu7Wz.webp',
      afterImage: 'img/bano-doble-lavabo.DyU1DUkJ_Znu7Wz.webp',
      duration: '6 días',
      year: '2026'
    },
    {
      id: 5,
      title: 'Estructura Galvanizada para Tabique Autoportante',
      category: 'Tabiques',
      location: 'Fuenlabrada, Madrid',
      description: 'Instalación de montantes de 70mm y canales con banda acústica estanca perimetral para distribución de dormitorios.',
      image: 'img/perfileria-tabique-estructura.DlthMHk-_1GGuHp.webp',
      afterImage: 'img/perfileria-tabique-estructura.DlthMHk-_1GGuHp.webp',
      duration: '3 días',
      year: '2026'
    },
    {
      id: 6,
      title: 'Estructura de Pladur para Armarios y Vestidor a Medida',
      category: 'Muebles',
      location: 'Majadahonda, Madrid',
      description: 'Construcción a medida de módulos y divisiones para vestidor con baldas reforzadas e iluminación interior integrada.',
      image: 'img/armarios-empotrados-construccion.DuDYALwq_Z2nydGz.webp',
      afterImage: 'img/armarios-empotrados-construccion.DuDYALwq_Z2nydGz.webp',
      duration: '4 días',
      year: '2026'
    },
    {
      id: 7,
      title: 'Techo Foseado con Conductos de Climatización',
      category: 'Techos',
      location: 'Retiro, Madrid',
      description: 'Ocultación estética de tuberías de aerotermia y conductos de climatización con trampillas invisibles registrables.',
      image: 'img/climatizacion-tubo-extraccion.B8YjA5de_ZfMoRz.webp',
      afterImage: 'img/climatizacion-tubo-extraccion.B8YjA5de_ZfMoRz.webp',
      duration: '5 días',
      year: '2026'
    },
    {
      id: 8,
      title: 'Cocina Abierta con Techo Foseado e Isla Central',
      category: 'Reformas',
      location: 'La Moraleja, Alcobendas',
      description: 'Apertura de espacio diáfano tirando tabique antiguo, foso decorativo de pladur en techo con extractor empotrado.',
      image: 'img/cocina-isla-gris.DCLeBwB-_12b5Po.webp',
      afterImage: 'img/cocina-isla-gris.DCLeBwB-_12b5Po.webp',
      duration: '3 semanas',
      year: '2026'
    },
    {
      id: 9,
      title: 'Tabiquería Divisoria de Doble Placa con Lana Mineral',
      category: 'Tabiques',
      location: 'Getafe, Madrid',
      description: 'Colocación de placa de yeso de 15mm atornillada sobre modulación de 400mm con relleno interior de lana de roca de alta densidad.',
      image: 'img/tabique-perfileria-placas.SiAMTEZg_Z1tl3C2.webp',
      afterImage: 'img/tabique-perfileria-placas.SiAMTEZg_Z1tl3C2.webp',
      duration: '3 días',
      year: '2026'
    },
    {
      id: 10,
      title: 'Tratamiento Técnico de Juntas y Acabado Q4 en Techo',
      category: 'Techos',
      location: 'Móstoles, Madrid',
      description: 'Encintado con cinta microperforada y empastado de tres capas para conseguir una superficie lisa sin imperfecciones.',
      image: 'img/falso-techo-cinta-tornillos.DPfMgenv_ZVcPa4.webp',
      afterImage: 'img/falso-techo-cinta-tornillos.DPfMgenv_ZVcPa4.webp',
      duration: '3 días',
      year: '2026'
    },
    {
      id: 11,
      title: 'Aislamiento Antihumedad con Placas Verdes H1 en Baño',
      category: 'Reformas',
      location: 'Moncloa - Aravaca, Madrid',
      description: 'Tabiquería especial hidrófuga resistente al agua y condensación previa al alicatado porcelánico de gran formato.',
      image: 'img/bano-travertino-vista2.H0FQV-bk_Z24yXYs.webp',
      afterImage: 'img/bano-travertino-vista2.H0FQV-bk_Z24yXYs.webp',
      duration: '5 días',
      year: '2026'
    },
    {
      id: 12,
      title: 'Falso Techo Exterior con Placas Hidrófugas en Porche',
      category: 'Techos',
      location: 'Boadilla del Monte, Madrid',
      description: 'Montaje de techo continuo en terraza semicubierta con placas especiales resistentes a cambios térmicos y humedad exterior.',
      image: 'img/porche-exterior-pladur-hidrofugo.VcWTDvv__ZXGue4.webp',
      afterImage: 'img/porche-exterior-pladur-hidrofugo.VcWTDvv__ZXGue4.webp',
      duration: '4 días',
      year: '2026'
    },
    {
      id: 13,
      title: 'Panelado e Integración de Armarios en Pasillo',
      category: 'Muebles',
      location: 'Pozuelo de Alarcón',
      description: 'Creación de frente empotrado en pladur con enrase de puertas de suelo a techo sin molduras para estilo minimalista.',
      image: 'img/armarios-pasillo-madera.j4dvVQ-j_vq6Vu.webp',
      afterImage: 'img/armarios-pasillo-madera.j4dvVQ-j_vq6Vu.webp',
      duration: '5 días',
      year: '2026'
    },
    {
      id: 14,
      title: 'Acondicionamiento y Tabiquería Ignífuga en Local Comercial',
      category: 'Reformas',
      location: 'Madrid Centro',
      description: 'División de zonas de venta, almacén y probadores con sistemas certificados contra incendios EI-120.',
      image: 'img/local-obra-proceso.Co5TiarM_2wd6JG.webp',
      afterImage: 'img/local-obra-proceso.Co5TiarM_2wd6JG.webp',
      duration: '2 semanas',
      year: '2026'
    },
    {
      id: 15,
      title: 'Insonorización Bajo Forjado con Silentblocks y Lana de Roca',
      category: 'Aislamiento',
      location: 'Leganés, Madrid',
      description: 'Amortiguadores acústicos anclados sobre forjado de hormigón y doble placa fonorresistente para eliminar ruidos de impacto.',
      image: 'img/previo-falso-techo-hormigon.CvLVcDmd_2gnMT1.webp',
      afterImage: 'img/previo-falso-techo-hormigon.CvLVcDmd_2gnMT1.webp',
      duration: '3 días',
      year: '2026'
    },
    {
      id: 16,
      title: 'Distribución Interior y Emplacado de Tabiques',
      category: 'Tabiques',
      location: 'Alcorcón, Madrid',
      description: 'Fijación rigurosa de tornillos avellanados cada 25cm comprobando plomadas y nivelación de paramentos.',
      image: 'img/pladur-tornillos-antes-enlucir.CZyGQUOE_pJl3C.webp',
      afterImage: 'img/pladur-tornillos-antes-enlucir.CZyGQUOE_pJl3C.webp',
      duration: '2 días',
      year: '2026'
    },
    {
      id: 17,
      title: 'Gran Sectorización en Nave Industrial y Oficinas Técnicas',
      category: 'Reformas',
      location: 'Polígono Cobo Calleja, Fuenlabrada',
      description: 'Construcción de módulos de oficinas en dos alturas con tabiques acústicos cortafuegos según normativa laboral.',
      image: 'img/nave-obra-grande.DyWgpH_e_Z1p8JGd.webp',
      afterImage: 'img/nave-obra-grande.DyWgpH_e_Z1p8JGd.webp',
      duration: '3 semanas',
      year: '2026'
    },
    {
      id: 18,
      title: 'Detalle de Hornacinas Retroiluminadas y Baño Suspendido',
      category: 'Reformas',
      location: 'Pozuelo de Alarcón',
      description: 'Hornacinas a medida en pladur hidrófugo con tiras LED IP65 sumergidas en perfil difusor de aluminio para luz ambiental.',
      image: 'img/bano-doble-lavabo-vista2.CCq9UAyI_TlxNi.webp',
      afterImage: 'img/bano-doble-lavabo-vista2.CCq9UAyI_TlxNi.webp',
      duration: '4 días',
      year: '2026'
    },
    {
      id: 19,
      title: 'Pasillo con Foseado Perimetral y Puertas Enrasadas',
      category: 'Techos',
      location: 'Barrio de Salamanca, Madrid',
      description: 'Falso techo con candileja longitudinal de luz indirecta y marcos invisibles de pladur para puertas de paso.',
      image: 'img/pasillo-carpinteria-acabado.CeuORyBo_ZlsXhO.webp',
      afterImage: 'img/pasillo-carpinteria-acabado.CeuORyBo_ZlsXhO.webp',
      duration: '5 días',
      year: '2026'
    },
    {
      id: 20,
      title: 'Techo Modular Desmontable Acústico',
      category: 'Techos',
      location: 'Getafe (Parque Empresarial)',
      description: 'Estructura colgada para techos registrables fonoabsorbentes con placa mineral para control de reverberación sonora.',
      image: 'img/nave-falso-techo-proceso.DUUua1HG_1MXdih.webp',
      afterImage: 'img/nave-falso-techo-proceso.DUUua1HG_1MXdih.webp',
      duration: '4 días',
      year: '2026'
    },
    {
      id: 21,
      title: 'Aislamiento Térmico de Fachada y Trasdosado Exterior',
      category: 'Aislamiento',
      location: 'Torrejón de Ardoz, Madrid',
      description: 'Rehabilitación y trasdosado exterior con aislamiento térmico continuo para eliminación de puentes térmicos.',
      image: 'img/obra-exterior-andamios.CQ52pfiY_ZDMC43.webp',
      afterImage: 'img/obra-exterior-andamios.CQ52pfiY_ZDMC43.webp',
      duration: '2 semanas',
      year: '2026'
    },
    {
      id: 22,
      title: 'Renovación de Nave Comercial con Techos Ignífugos',
      category: 'Reformas',
      location: 'San Sebastián de los Reyes',
      description: 'Reforma integral y sectorización de naves con placas cortafuego Knauf DF / Pladur Foc para seguridad antiincendios.',
      image: 'img/reforma-local-diafano.DCvA8NBa_Z2qjvaE.webp',
      afterImage: 'img/reforma-local-diafano.DCvA8NBa_Z2qjvaE.webp',
      duration: '10 días',
      year: '2026'
    },
    {
      id: 23,
      title: 'Sustitución de Techos Antiguos por Falso Techo Continuo',
      category: 'Techos',
      location: 'Madrid Capital (Tetuán)',
      description: 'Desmontaje y retirada de escayola fisurada e instalación de nuevo techo continuo de pladur con lana de roca.',
      image: 'img/techo-desmontable-retirada.6E1WpEPj_2BCqH.webp',
      afterImage: 'img/techo-desmontable-retirada.6E1WpEPj_2BCqH.webp',
      duration: '3 días',
      year: '2026'
    }
  ],
  testimonials: [
    {
      id: 1,
      name: 'Carlos Mendoza',
      location: 'Madrid (Barrio Salamanca)',
      service: 'Falso techo foseado con luz LED',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&h=160&q=80',
      comment: 'Un trabajo impecable. El foseado con luz indirecta le dio una categoría increíble a mi salón. Los pladuristas fueron súper limpios, protegieron todo el suelo y terminaron un día antes de lo previsto. Muy recomendables.',
      date: 'Febrero 2026'
    },
    {
      id: 2,
      name: 'Elena Garrido',
      location: 'Fuenlabrada, Madrid',
      service: 'Reforma integral y tabiquería',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&h=160&q=80',
      comment: 'Contacté con Goldenplac por recomendación y fue un acierto rotundo. Presupuesto detallado sin sorpresas, cumplieron el plazo al 100% y la calidad del acabado en las juntas de pladur es perfecta.',
      date: 'Enero 2026'
    },
    {
      id: 3,
      name: 'Miguel Ángel R.',
      location: 'Pozuelo de Alarcón',
      service: 'Mueble de pladur para TV',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&h=160&q=80',
      comment: 'Queríamos un mueble para la televisión que ocultara todos los cables y tuviera huecos iluminados. Nos hicieron un diseño precioso en 3 días. La relación calidad-precio no tiene rival en Madrid.',
      date: 'Febrero 2026'
    },
    {
      id: 4,
      name: 'Sofía Valderrama',
      location: 'Getafe, Madrid',
      service: 'Insonorización de dormitorio',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&h=160&q=80',
      comment: 'No podíamos dormir por el ruido de la televisión del vecino. Instalaron el trasdosado acústico con lana de roca y membrana pesada y se solucionó por completo el problema. ¡Mil gracias!',
      date: 'Diciembre 2025'
    },
    {
      id: 5,
      name: 'David Romero',
      location: 'Las Rozas, Madrid',
      service: 'Reforma y techos acústicos',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&h=160&q=80',
      comment: 'Contratamos a Goldenplac para la adecuación de nuestra clínica en Las Rozas. Ejecutaron la tabiquería insonorizada y los techos registrables en tiempo récord. Gran profesionalidad y trato cercano. 100% recomendados.',
      date: 'Enero 2026'
    },
    {
      id: 6,
      name: 'Lucía Herranz',
      location: 'Alcobendas (La Moraleja)',
      service: 'Falso techo con candileja LED',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&h=160&q=80',
      comment: 'Buscábamos un cambio moderno en la iluminación de casa y el resultado superó nuestras expectativas. La luz indirecta cálida quedó espectacular y dejaron todo impecable y limpio. Da gusto encontrar profesionales así en Madrid.',
      date: 'Febrero 2026'
    }
  ],
  beforeAfter: [
    {
      id: 1,
      title: 'Techos & Iluminación LED',
      category: 'Techos',
      beforeImage: 'img/previo-falso-techo-hormigon.CvLVcDmd_2gnMT1.webp',
      afterImage: 'assets/images/techos-led.jpg',
      caption: 'Falso techo suspendido de pladur con candileja perimetral de luz indirecta LED cálida en Madrid (Antes: Forjado de hormigón en bruto vs. Después: Acabado continuo de lujo).'
    },
    {
      id: 2,
      title: 'Reforma de Local Comercial',
      category: 'Locales',
      beforeImage: 'img/falso-techo-cinta-tornillos.DPfMgenv_ZVcPa4.webp',
      afterImage: 'img/reforma-local-diafano.DCvA8NBa_Z2qjvaE.webp',
      caption: 'Reforma integral de local en Madrid: Fase de placas, juntas con cinta y tornillería vs. Local diáfano terminado con techo liso y pavimento.'
    },
    {
      id: 3,
      title: 'Estructura & Tabiquería',
      category: 'Tabiques',
      beforeImage: 'img/perfileria-tabique-estructura.DlthMHk-_1GGuHp.webp',
      afterImage: 'assets/images/hero-bg.jpg',
      caption: 'Tabiquería y techos de pladur: Estructura de perfiles de acero galvanizado vs. Salón terminado con foseados y molduras de alta gama.'
    }
  ],
  leads: [
    {
      id: 101,
      name: 'Javier Navarro',
      phone: '+34 612 345 678',
      email: 'j.navarro@gmail.com',
      service: 'Falsos Techos y Foseados LED',
      areaM2: '45',
      zone: 'Madrid Capital (Chamberí)',
      message: 'Buenas, necesito instalar falso techo con iluminación LED foseada en salón y pasillo. Me gustaría recibir presupuesto y disponibilidad.',
      status: 'nuevo',
      createdAt: '2026-08-28 17:42'
    },
    {
      id: 102,
      name: 'Beatriz Lomas',
      phone: '+34 689 443 210',
      email: 'beatriz.lomas@hotmail.com',
      service: 'Muebles de Pladur a Medida',
      areaM2: '15',
      zone: 'Fuenlabrada',
      message: 'Quiero presupuesto para un mueble de pladur para salón de 3.20m de ancho con hueco para TV de 65 pulgadas y estantes con luz.',
      status: 'contactado',
      createdAt: '2026-08-27 11:15'
    }
  ],
  settings: {
    adminPin: '1234',
    calculatorPricing: {
      'techos-led': { base: 34, label: 'Falsos Techos continuos o foseados LED' },
      'tabiques': { base: 36, label: 'Tabiques y trasdosados divisorios' },
      'muebles': { base: 65, label: 'Muebles de TV y hornacinas' },
      'aislamiento': { base: 48, label: 'Insonorización acústica y térmica' },
      'reforma': { base: 420, label: 'Reforma integral llave en mano' }
    }
  }
};

class GoldenplacStore {
  constructor() {
    this.data = this.load();
    this.listeners = [];
  }

  load() {
    try {
      let stored = localStorage.getItem(STORAGE_KEY);

      // Migración desde versiones anteriores si no existe v6
      if (!stored) {
        const vOld = localStorage.getItem('goldenplac_database_v5') || localStorage.getItem('goldenplac_database_v4') || localStorage.getItem('goldenplac_database_v3') || localStorage.getItem('goldenplac_database_v2') || localStorage.getItem('goldenplac_database_v1');
        let parsedOld = {};
        if (vOld) {
          try { parsedOld = JSON.parse(vOld); } catch(e) {}
        }
        const migrated = {
          company: { ...DEFAULT_DATA.company, ...(parsedOld.company || {}) },
          services: (parsedOld.services && parsedOld.services.length) ? parsedOld.services : DEFAULT_DATA.services,
          projects: DEFAULT_DATA.projects,
          testimonials: (parsedOld.testimonials && parsedOld.testimonials.length >= 6) ? parsedOld.testimonials : DEFAULT_DATA.testimonials,
          beforeAfter: parsedOld.beforeAfter || DEFAULT_DATA.beforeAfter,
          leads: parsedOld.leads || DEFAULT_DATA.leads,
          settings: { ...DEFAULT_DATA.settings, ...(parsedOld.settings || {}) }
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        // Asegurar lista completa de obras y testimonios simétricos con foto
        const projects = (parsed.projects && parsed.projects.length >= 20) 
          ? parsed.projects 
          : DEFAULT_DATA.projects;

        const testimonials = (parsed.testimonials && parsed.testimonials.length >= 6 && parsed.testimonials[0].avatar)
          ? parsed.testimonials
          : DEFAULT_DATA.testimonials;

        const beforeAfter = (parsed.beforeAfter && parsed.beforeAfter.length >= 1)
          ? parsed.beforeAfter
          : DEFAULT_DATA.beforeAfter;

        const merged = {
          company: { 
            ...DEFAULT_DATA.company, 
            ...(parsed.company || {}),
            googleMapsUrl: (parsed.company && parsed.company.googleMapsUrl) || DEFAULT_DATA.company.googleMapsUrl
          },
          services: parsed.services && parsed.services.length ? parsed.services : DEFAULT_DATA.services,
          projects: projects,
          testimonials: testimonials,
          beforeAfter: beforeAfter,
          leads: parsed.leads || DEFAULT_DATA.leads,
          settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) }
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.warn('Error loading storage, using default data:', e);
    }
    const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); } catch(e) {}
    return fresh;
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notify();
    } catch (e) {
      console.error('Error saving storage:', e);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => {
      try { cb(this.data); } catch (e) { console.error(e); }
    });
  }

  // Getters
  getCompany() { return this.data.company; }
  getServices() { return this.data.services; }
  getProjects() { return this.data.projects; }
  getTestimonials() { return this.data.testimonials; }
  getBeforeAfter() { return this.data.beforeAfter || DEFAULT_DATA.beforeAfter; }
  getLeads() { return this.data.leads; }
  getSettings() { return this.data.settings; }

  // Setters
  updateCompany(newCompany) {
    this.data.company = { ...this.data.company, ...newCompany };
    this.save();
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
  }

  // Services CRUD
  saveService(service) {
    if (!service.id) {
      service.id = 'srv_' + Date.now();
      this.data.services.push(service);
    } else {
      const idx = this.data.services.findIndex(s => s.id === service.id);
      if (idx !== -1) {
        this.data.services[idx] = service;
      } else {
        this.data.services.push(service);
      }
    }
    this.save();
  }

  deleteService(serviceId) {
    this.data.services = this.data.services.filter(s => s.id !== serviceId);
    this.save();
  }

  // Projects CRUD
  saveProject(project) {
    if (!project.id) {
      project.id = Date.now();
      this.data.projects.unshift(project);
    } else {
      const idx = this.data.projects.findIndex(p => p.id === project.id);
      if (idx !== -1) {
        this.data.projects[idx] = project;
      } else {
        this.data.projects.unshift(project);
      }
    }
    this.save();
  }

  deleteProject(projectId) {
    this.data.projects = this.data.projects.filter(p => p.id !== projectId);
    this.save();
  }

  // Testimonials CRUD
  saveTestimonial(testimonial) {
    if (!testimonial.id) {
      testimonial.id = Date.now();
      this.data.testimonials.unshift(testimonial);
    } else {
      const idx = this.data.testimonials.findIndex(t => t.id === Number(testimonial.id) || t.id === testimonial.id);
      if (idx !== -1) {
        this.data.testimonials[idx] = testimonial;
      } else {
        this.data.testimonials.unshift(testimonial);
      }
    }
    this.save();
  }

  deleteTestimonial(testId) {
    this.data.testimonials = this.data.testimonials.filter(t => t.id !== Number(testId) && t.id !== testId);
    this.save();
  }

  // Antes y Después (Comparador) CRUD
  saveBeforeAfter(item) {
    if (!this.data.beforeAfter) {
      this.data.beforeAfter = JSON.parse(JSON.stringify(DEFAULT_DATA.beforeAfter));
    }
    if (!item.id) {
      item.id = Date.now();
      this.data.beforeAfter.push(item);
    } else {
      const idx = this.data.beforeAfter.findIndex(b => b.id === Number(item.id) || b.id === item.id);
      if (idx !== -1) {
        this.data.beforeAfter[idx] = item;
      } else {
        this.data.beforeAfter.push(item);
      }
    }
    this.save();
    return item;
  }

  deleteBeforeAfter(itemId) {
    if (!this.data.beforeAfter) return;
    this.data.beforeAfter = this.data.beforeAfter.filter(b => b.id !== Number(itemId) && b.id !== itemId);
    this.save();
  }

  // Leads CRUD
  addLead(leadData) {
    const lead = {
      id: Date.now(),
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'nuevo',
      ...leadData
    };
    this.data.leads.unshift(lead);
    this.save();
    return lead;
  }

  updateLeadStatus(leadId, newStatus) {
    const lead = this.data.leads.find(l => l.id === Number(leadId) || l.id === leadId);
    if (lead) {
      lead.status = newStatus;
      this.save();
    }
  }

  deleteLead(leadId) {
    this.data.leads = this.data.leads.filter(l => l.id !== Number(leadId) && l.id !== leadId);
    this.save();
  }

  // Backup & Restore
  exportBackupJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importBackupJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.company && parsed.services) {
        this.data = parsed;
        this.save();
        return true;
      }
    } catch (e) {
      console.error('Invalid backup JSON:', e);
    }
    return false;
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.save();
  }
}

// Global Singleton
window.GoldenStore = new GoldenplacStore();
