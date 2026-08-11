require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Question = require('../models/Question');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  await Course.deleteMany({});
  await Lesson.deleteMany({});
  await Question.deleteMany({});

  const courses = await Course.insertMany([
    {
      title: 'Waves and Optics',
      description: 'Core physics concepts on wave behavior and light.',
      subject: 'Physics',
      studentTypes: ['secondary_school', 'utme_aspirant'],
    },
    {
      title: 'Organic Chemistry Basics',
      description: 'Introduction to carbon compounds and reactions.',
      subject: 'Chemistry',
      studentTypes: ['secondary_school', 'utme_aspirant'],
    },
    {
      title: 'Algebra Foundations',
      description: 'Equations, expressions, and problem solving.',
      subject: 'Mathematics',
      studentTypes: ['secondary_school', 'utme_aspirant'],
    },
  ]);

  const lessonsData = [
    {
      courseId: courses[0]._id, title: 'Introduction to Waves', order: 1, durationMinutes: 12,
      notes: `A wave is a disturbance that transfers energy from one point to another without transferring matter. Waves are broadly classified into two types: mechanical waves, which need a medium to travel through (like sound waves through air, or water waves), and electromagnetic waves, which can travel through a vacuum (like light and radio waves).

Waves are further classified by the direction of particle vibration relative to the direction of wave travel:
- Transverse waves: particles vibrate perpendicular to the direction of travel (e.g. light waves, waves on a string).
- Longitudinal waves: particles vibrate parallel to the direction of travel (e.g. sound waves).

Key terms to know: amplitude (maximum displacement from rest position), wavelength (distance between two successive identical points, e.g. crest to crest), frequency (number of complete waves passing a point per second, measured in Hertz), and period (time taken for one complete wave cycle).`,
    },
    {
      courseId: courses[0]._id, title: 'Wave Properties', order: 2, durationMinutes: 15,
      notes: `All waves share a fundamental relationship: velocity = frequency × wavelength (v = fλ). This means that for a wave traveling at a constant speed, frequency and wavelength are inversely related — as one increases, the other decreases.

Waves also exhibit several key behaviors:
- Reflection: a wave bounces back when it hits a barrier.
- Refraction: a wave changes direction and speed when passing from one medium into another.
- Diffraction: a wave spreads out after passing through a narrow gap or around an obstacle.
- Interference: two or more waves overlap and combine — constructively (amplitudes add) or destructively (amplitudes cancel).

Understanding these properties is essential for topics like sound in music, radio transmission, and how lenses and mirrors work in optics.`,
    },
    {
      courseId: courses[0]._id, title: 'Reflection and Refraction', order: 3, durationMinutes: 18,
      notes: `Reflection occurs when a wave bounces off a surface. For light, the law of reflection states that the angle of incidence equals the angle of reflection, both measured from the normal (an imaginary line perpendicular to the surface).

Refraction occurs when a wave passes from one medium into another with a different density, causing it to change speed and bend. This is why a straw appears bent when placed in a glass of water — light travels slower in water than in air, bending as it crosses the boundary.

The refractive index of a medium describes how much it slows down light compared to a vacuum. A higher refractive index means light bends more and travels slower in that medium. This principle is the basis for how lenses focus light in eyeglasses, cameras, and microscopes.`,
    },
    {
      courseId: courses[1]._id, title: 'What is Organic Chemistry?', order: 1, durationMinutes: 10,
      notes: `Organic chemistry is the study of carbon-containing compounds. Carbon is unique because it can form four strong covalent bonds and link with other carbon atoms to create long chains, branches, and rings — giving rise to millions of different compounds.

Organic compounds are the basis of all known life and are found in fuels, plastics, medicines, and food. They're typically classified by their functional groups — specific arrangements of atoms that give a molecule its characteristic chemical behavior (e.g. the -OH group in alcohols, or the -COOH group in carboxylic acids).

Hydrocarbons — compounds made purely of hydrogen and carbon — form the foundation of organic chemistry and are divided into alkanes, alkenes, and alkynes based on the type of bonds between carbon atoms.`,
    },
    {
      courseId: courses[1]._id, title: 'Hydrocarbons', order: 2, durationMinutes: 14,
      notes: `Hydrocarbons are compounds made only of hydrogen and carbon atoms, and they form three main families based on their carbon-carbon bonds:

Alkanes (general formula CnH2n+2) are saturated hydrocarbons — meaning all carbon-carbon bonds are single bonds. Examples include methane (CH4) and ethane (C2H6). They're relatively unreactive and are the main components of fuels like petrol and natural gas.

Alkenes (CnH2n) contain at least one carbon-carbon double bond, making them unsaturated and more reactive than alkanes. Ethene (C2H4) is the simplest example, and is important in making plastics like polyethylene.

Alkynes (CnH2n-2) contain at least one carbon-carbon triple bond. Ethyne (C2H2), commonly known as acetylene, is used in welding due to the high heat produced when it burns.`,
    },
    {
      courseId: courses[2]._id, title: 'Linear Equations', order: 1, durationMinutes: 11,
      notes: `A linear equation is an equation where the highest power of the variable is 1 — meaning its graph is always a straight line. The general form is: ax + b = c, where a, b, and c are constants and x is the unknown.

To solve a linear equation, isolate the variable by performing the same operation on both sides of the equation. For example, to solve 2x + 5 = 15:
1. Subtract 5 from both sides: 2x = 10
2. Divide both sides by 2: x = 5

Linear equations can also involve two variables (like y = mx + c), where m represents the slope (steepness) of the line and c is the y-intercept (where the line crosses the y-axis). This form is essential for graphing straight lines and solving simultaneous equations.`,
    },
    {
      courseId: courses[2]._id, title: 'Quadratic Equations', order: 2, durationMinutes: 16,
      notes: `A quadratic equation has the general form ax² + bx + c = 0, where a ≠ 0. Unlike linear equations, quadratics can have up to two solutions because the variable is squared.

There are three main methods to solve quadratic equations:
1. Factorization: rewriting the equation as a product of two brackets, e.g. x² - 5x + 6 = 0 becomes (x-2)(x-3) = 0, giving x = 2 or x = 3.
2. Completing the square: rearranging the equation into the form (x + p)² = q.
3. The quadratic formula: x = (-b ± √(b² - 4ac)) / 2a — this always works, even when factorization is difficult.

The discriminant (b² - 4ac) tells you how many real solutions exist: positive means two solutions, zero means one repeated solution, and negative means no real solutions.`,
    },
  ];
  await Lesson.insertMany(lessonsData);

  const questionsData = [
    // ===== English Language =====
    {
      subject: 'English Language', examType: 'JAMB',
      questionText: "Choose the option that best completes the sentence: 'She has been ___ the piano since she was five.'",
      options: ['play', 'playing', 'played', 'plays'], correctAnswer: 1,
      explanation: "Present perfect continuous tense requires 'has been' + verb-ing.", difficulty: 'easy',
    },
    {
      subject: 'English Language', examType: 'JAMB',
      questionText: 'Identify the correctly spelled word.',
      options: ['Recieve', 'Receive', 'Receve', 'Receeve'], correctAnswer: 1,
      explanation: "'Receive' follows the 'i before e except after c' rule.", difficulty: 'easy',
    },
    {
      subject: 'English Language', examType: 'JAMB',
      questionText: "Choose the option nearest in meaning to the underlined word: The teacher's explanation was very 'lucid'.",
      options: ['Confusing', 'Clear', 'Lengthy', 'Boring'], correctAnswer: 1,
      explanation: "'Lucid' means clear and easy to understand.", difficulty: 'medium',
    },
    {
      subject: 'English Language', examType: 'JAMB',
      questionText: "Identify the correct antonym for 'benevolent'.",
      options: ['Kind', 'Generous', 'Malevolent', 'Charitable'], correctAnswer: 2,
      explanation: "'Malevolent' means having or showing ill will, the opposite of benevolent.", difficulty: 'medium',
    },
    {
      subject: 'English Language', examType: 'JAMB',
      questionText: "Choose the option that correctly completes: 'Neither the students nor the teacher ___ ready.'",
      options: ['is', 'are', 'were', 'have been'], correctAnswer: 0,
      explanation: "With 'neither...nor', the verb agrees with the subject closer to it (teacher, singular).", difficulty: 'medium',
    },
    {
      subject: 'English Language', examType: 'JAMB',
      questionText: "Which word is a synonym for 'meticulous'?",
      options: ['Careless', 'Thorough', 'Quick', 'Lazy'], correctAnswer: 1,
      explanation: "'Meticulous' means showing great attention to detail; thorough.", difficulty: 'easy',
    },

    // ===== Mathematics =====
    {
      subject: 'Mathematics', examType: 'JAMB',
      questionText: 'Solve for x: 2x + 5 = 15',
      options: ['5', '10', '7.5', '4'], correctAnswer: 0,
      explanation: '2x = 10, so x = 5.', difficulty: 'easy',
    },
    {
      subject: 'Mathematics', examType: 'JAMB',
      questionText: 'What is the discriminant of x² - 4x + 4 = 0?',
      options: ['0', '4', '-4', '16'], correctAnswer: 0,
      explanation: 'Discriminant = b² - 4ac = 16 - 16 = 0.', difficulty: 'medium',
    },
    {
      subject: 'Mathematics', examType: 'JAMB',
      questionText: 'Simplify: 3/4 + 1/2',
      options: ['5/4', '4/6', '1', '5/8'], correctAnswer: 0,
      explanation: '3/4 + 2/4 = 5/4.', difficulty: 'easy',
    },
    {
      subject: 'Mathematics', examType: 'JAMB',
      questionText: 'What is the value of sin(30°)?',
      options: ['0', '0.5', '1', '√3/2'], correctAnswer: 1,
      explanation: 'sin(30°) = 1/2 = 0.5.', difficulty: 'medium',
    },
    {
      subject: 'Mathematics', examType: 'JAMB',
      questionText: 'Find the next number in the sequence: 2, 6, 12, 20, ...',
      options: ['28', '30', '26', '32'], correctAnswer: 1,
      explanation: 'Differences are 4, 6, 8, 10 — so next term is 20 + 10 = 30.', difficulty: 'medium',
    },
    {
      subject: 'Mathematics', examType: 'JAMB',
      questionText: 'What is 15% of 200?',
      options: ['20', '25', '30', '35'], correctAnswer: 2,
      explanation: '15% of 200 = 0.15 × 200 = 30.', difficulty: 'easy',
    },

    // ===== Physics =====
    {
      subject: 'Physics', examType: 'JAMB',
      questionText: 'What is the SI unit of frequency?',
      options: ['Hertz', 'Newton', 'Joule', 'Watt'], correctAnswer: 0,
      explanation: 'Frequency is measured in Hertz (Hz), representing cycles per second.', difficulty: 'easy',
    },
    {
      subject: 'Physics', examType: 'JAMB',
      questionText: 'Which phenomenon explains why a straw appears bent in water?',
      options: ['Reflection', 'Refraction', 'Diffraction', 'Polarization'], correctAnswer: 1,
      explanation: 'Refraction occurs when light changes speed passing between media, bending the apparent path.', difficulty: 'medium',
    },
    {
      subject: 'Physics', examType: 'JAMB',
      questionText: 'What is the acceleration due to gravity approximately equal to on Earth?',
      options: ['8.9 m/s²', '9.8 m/s²', '10.8 m/s²', '7.8 m/s²'], correctAnswer: 1,
      explanation: 'Standard gravity on Earth is approximately 9.8 m/s².', difficulty: 'easy',
    },
    {
      subject: 'Physics', examType: 'JAMB',
      questionText: "Which law states that 'for every action, there is an equal and opposite reaction'?",
      options: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Conservation of Energy"], correctAnswer: 2,
      explanation: "Newton's Third Law describes action-reaction force pairs.", difficulty: 'easy',
    },
    {
      subject: 'Physics', examType: 'JAMB',
      questionText: 'What type of lens is used to correct short-sightedness (myopia)?',
      options: ['Concave lens', 'Convex lens', 'Cylindrical lens', 'Bifocal lens'], correctAnswer: 0,
      explanation: 'A diverging (concave) lens corrects myopia by spreading light rays before they reach the eye.', difficulty: 'medium',
    },
    {
      subject: 'Physics', examType: 'JAMB',
      questionText: 'What quantity is measured in Ohms?',
      options: ['Current', 'Voltage', 'Resistance', 'Power'], correctAnswer: 2,
      explanation: 'Electrical resistance is measured in Ohms (Ω).', difficulty: 'easy',
    },

    // ===== Chemistry =====
    {
      subject: 'Chemistry', examType: 'JAMB',
      questionText: 'What is the general formula for alkanes?',
      options: ['CnH2n', 'CnH2n+2', 'CnH2n-2', 'CnHn'], correctAnswer: 1,
      explanation: 'Alkanes are saturated hydrocarbons with the formula CnH2n+2.', difficulty: 'medium',
    },
    {
      subject: 'Chemistry', examType: 'JAMB',
      questionText: 'Which of these is a noble gas?',
      options: ['Oxygen', 'Nitrogen', 'Argon', 'Hydrogen'], correctAnswer: 2,
      explanation: 'Argon is a noble gas found in Group 18 of the periodic table.', difficulty: 'easy',
    },
    {
      subject: 'Chemistry', examType: 'JAMB',
      questionText: 'What is the pH of a neutral solution at 25°C?',
      options: ['0', '7', '14', '1'], correctAnswer: 1,
      explanation: 'A neutral solution has a pH of 7 at standard temperature.', difficulty: 'easy',
    },
    {
      subject: 'Chemistry', examType: 'JAMB',
      questionText: 'What is the chemical symbol for Sodium?',
      options: ['So', 'Sd', 'Na', 'S'], correctAnswer: 2,
      explanation: "Sodium's chemical symbol is 'Na', from its Latin name Natrium.", difficulty: 'easy',
    },
    {
      subject: 'Chemistry', examType: 'JAMB',
      questionText: 'Which particle has a negative charge?',
      options: ['Proton', 'Neutron', 'Electron', 'Nucleus'], correctAnswer: 2,
      explanation: 'Electrons carry a negative charge and orbit the nucleus.', difficulty: 'easy',
    },
    {
      subject: 'Chemistry', examType: 'JAMB',
      questionText: 'What type of reaction occurs when an acid reacts with a base?',
      options: ['Oxidation', 'Neutralization', 'Combustion', 'Decomposition'], correctAnswer: 1,
      explanation: 'Acid + base reactions are called neutralization reactions, producing salt and water.', difficulty: 'medium',
    },

    // ===== Biology =====
    {
      subject: 'Biology', examType: 'JAMB',
      questionText: 'Which organelle is known as the powerhouse of the cell?',
      options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Golgi apparatus'], correctAnswer: 2,
      explanation: "Mitochondria generate most of the cell's ATP through respiration.", difficulty: 'easy',
    },
    {
      subject: 'Biology', examType: 'JAMB',
      questionText: 'What is the process by which plants lose water vapor through their leaves?',
      options: ['Osmosis', 'Transpiration', 'Diffusion', 'Photosynthesis'], correctAnswer: 1,
      explanation: 'Transpiration is the loss of water vapor mainly through stomata in leaves.', difficulty: 'medium',
    },
    {
      subject: 'Biology', examType: 'JAMB',
      questionText: 'Which blood cells are responsible for fighting infection?',
      options: ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma cells'], correctAnswer: 1,
      explanation: 'White blood cells (leukocytes) are part of the immune system and fight infection.', difficulty: 'easy',
    },
    {
      subject: 'Biology', examType: 'JAMB',
      questionText: 'What is the male reproductive part of a flower called?',
      options: ['Stigma', 'Stamen', 'Ovary', 'Sepal'], correctAnswer: 1,
      explanation: 'The stamen, consisting of anther and filament, is the male part of a flower.', difficulty: 'medium',
    },
    {
      subject: 'Biology', examType: 'JAMB',
      questionText: 'Which gas do plants absorb from the atmosphere for photosynthesis?',
      options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], correctAnswer: 2,
      explanation: 'Plants absorb carbon dioxide and use it with water and light to produce glucose.', difficulty: 'easy',
    },
    {
      subject: 'Biology', examType: 'JAMB',
      questionText: 'What is the basic unit of heredity called?',
      options: ['Chromosome', 'Gene', 'Nucleus', 'DNA strand'], correctAnswer: 1,
      explanation: 'A gene is the basic physical and functional unit of heredity.', difficulty: 'easy',
    },

    // ===== Government =====
    {
      subject: 'Government', examType: 'JAMB',
      questionText: 'What is the term of office for a Nigerian President under the 1999 Constitution?',
      options: ['3 years', '4 years', '5 years', '6 years'], correctAnswer: 1,
      explanation: "Nigeria's President serves a 4-year term, renewable once.", difficulty: 'easy',
    },
    {
      subject: 'Government', examType: 'JAMB',
      questionText: 'Which arm of government is responsible for making laws?',
      options: ['Executive', 'Judiciary', 'Legislature', 'Civil service'], correctAnswer: 2,
      explanation: 'The Legislature (National Assembly in Nigeria) is responsible for law-making.', difficulty: 'easy',
    },
    {
      subject: 'Government', examType: 'JAMB',
      questionText: 'What principle ensures no single arm of government becomes too powerful?',
      options: ['Federalism', 'Separation of powers', 'Rule of law', 'Fundamental human rights'], correctAnswer: 1,
      explanation: 'Separation of powers divides authority among the executive, legislature, and judiciary.', difficulty: 'medium',
    },
    {
      subject: 'Government', examType: 'JAMB',
      questionText: 'Nigeria practices which system of government?',
      options: ['Unitary', 'Federal', 'Confederal', 'Monarchy'], correctAnswer: 1,
      explanation: 'Nigeria operates a federal system with powers shared between federal and state governments.', difficulty: 'easy',
    },
    {
      subject: 'Government', examType: 'JAMB',
      questionText: 'What is the minimum age to contest for the office of the President in Nigeria?',
      options: ['30', '35', '40', '45'], correctAnswer: 1,
      explanation: 'The Nigerian Constitution sets 35 as the minimum age for presidential candidates.', difficulty: 'medium',
    },
    {
      subject: 'Government', examType: 'JAMB',
      questionText: 'What do we call a system where power is inherited within a family?',
      options: ['Democracy', 'Monarchy', 'Aristocracy', 'Theocracy'], correctAnswer: 1,
      explanation: 'A monarchy is a system where leadership is typically hereditary.', difficulty: 'easy',
    },

    // ===== Economics =====
    {
      subject: 'Economics', examType: 'JAMB',
      questionText: 'What term describes the study of how individuals and firms make decisions with limited resources?',
      options: ['Sociology', 'Economics', 'Political science', 'Psychology'], correctAnswer: 1,
      explanation: 'Economics studies how scarce resources are allocated among competing uses.', difficulty: 'easy',
    },
    {
      subject: 'Economics', examType: 'JAMB',
      questionText: 'What happens to demand when the price of a product increases, all else equal?',
      options: ['Demand increases', 'Demand decreases', 'Demand stays the same', 'Supply decreases'], correctAnswer: 1,
      explanation: 'The law of demand states that as price rises, quantity demanded generally falls.', difficulty: 'easy',
    },
    {
      subject: 'Economics', examType: 'JAMB',
      questionText: 'What is the term for a persistent rise in the general price level?',
      options: ['Deflation', 'Inflation', 'Stagnation', 'Recession'], correctAnswer: 1,
      explanation: 'Inflation refers to a sustained increase in the general price level of goods and services.', difficulty: 'easy',
    },
    {
      subject: 'Economics', examType: 'JAMB',
      questionText: 'Which of these is a factor of production?',
      options: ['Inflation', 'Land', 'Demand', 'Tax'], correctAnswer: 1,
      explanation: 'The classic factors of production are land, labor, capital, and entrepreneurship.', difficulty: 'medium',
    },
    {
      subject: 'Economics', examType: 'JAMB',
      questionText: 'What is opportunity cost?',
      options: [
        'The total cost of production',
        'The value of the next best alternative forgone',
        'The price paid for a good',
        'The cost of labor only',
      ], correctAnswer: 1,
      explanation: 'Opportunity cost is the value of the best alternative given up when a choice is made.', difficulty: 'medium',
    },
    {
      subject: 'Economics', examType: 'JAMB',
      questionText: 'A market structure with only one seller is called?',
      options: ['Oligopoly', 'Monopoly', 'Perfect competition', 'Duopoly'], correctAnswer: 1,
      explanation: 'A monopoly exists when a single seller dominates the entire market for a good or service.', difficulty: 'easy',
    },

    // ===== Geography =====
    {
      subject: 'Geography', examType: 'JAMB',
      questionText: 'What is the longest river in Africa?',
      options: ['Niger River', 'Congo River', 'Nile River', 'Zambezi River'], correctAnswer: 2,
      explanation: 'The Nile River, flowing through northeastern Africa, is the longest river on the continent.', difficulty: 'easy',
    },
    {
      subject: 'Geography', examType: 'JAMB',
      questionText: 'What instrument is used to measure atmospheric pressure?',
      options: ['Thermometer', 'Barometer', 'Hygrometer', 'Anemometer'], correctAnswer: 1,
      explanation: 'A barometer measures atmospheric pressure.', difficulty: 'easy',
    },
    {
      subject: 'Geography', examType: 'JAMB',
      questionText: 'Which layer of the Earth is molten and lies beneath the crust?',
      options: ['Core', 'Mantle', 'Lithosphere', 'Crust'], correctAnswer: 1,
      explanation: 'The mantle lies beneath the crust and is largely composed of semi-molten rock.', difficulty: 'medium',
    },
    {
      subject: 'Geography', examType: 'JAMB',
      questionText: 'What type of rainfall occurs when moist air rises over a mountain range?',
      options: ['Convectional rainfall', 'Relief (orographic) rainfall', 'Frontal rainfall', 'Cyclonic rainfall'], correctAnswer: 1,
      explanation: 'Relief/orographic rainfall occurs when air is forced to rise over mountains, cools, and condenses.', difficulty: 'medium',
    },
    {
      subject: 'Geography', examType: 'JAMB',
      questionText: 'Which of these is a renewable source of energy?',
      options: ['Coal', 'Natural gas', 'Solar power', 'Crude oil'], correctAnswer: 2,
      explanation: 'Solar power is renewable because sunlight is a naturally replenished resource.', difficulty: 'easy',
    },
    {
      subject: 'Geography', examType: 'JAMB',
      questionText: 'Nigeria lies mainly within which climate zone?',
      options: ['Polar', 'Tropical', 'Temperate', 'Arctic'], correctAnswer: 1,
      explanation: 'Nigeria lies within the tropics, giving it a generally tropical climate.', difficulty: 'easy',
    },

    // ===== Commerce =====
    {
      subject: 'Commerce', examType: 'JAMB',
      questionText: 'What is the term for buying goods in one market and selling in another to profit from price differences?',
      options: ['Retailing', 'Arbitrage', 'Wholesaling', 'Bartering'], correctAnswer: 1,
      explanation: 'Arbitrage involves exploiting price differences of the same good across markets.', difficulty: 'medium',
    },
    {
      subject: 'Commerce', examType: 'JAMB',
      questionText: 'Which document is issued by a seller to a buyer detailing goods sold and amount owed?',
      options: ['Receipt', 'Invoice', 'Cheque', 'Voucher'], correctAnswer: 1,
      explanation: 'An invoice is a bill sent by a seller to a buyer listing products/services and amounts due.', difficulty: 'easy',
    },
    {
      subject: 'Commerce', examType: 'JAMB',
      questionText: 'What is the middleman who buys directly from producers and sells to retailers called?',
      options: ['Retailer', 'Wholesaler', 'Consumer', 'Agent'], correctAnswer: 1,
      explanation: 'A wholesaler buys in bulk from producers and sells smaller quantities to retailers.', difficulty: 'easy',
    },
    {
      subject: 'Commerce', examType: 'JAMB',
      questionText: 'Which of these is NOT a function of money?',
      options: ['Medium of exchange', 'Store of value', 'Unit of account', 'Factor of production'], correctAnswer: 3,
      explanation: 'Money functions as a medium of exchange, store of value, and unit of account — not a factor of production.', difficulty: 'medium',
    },
    {
      subject: 'Commerce', examType: 'JAMB',
      questionText: 'What term describes goods bought for immediate consumption rather than resale?',
      options: ['Capital goods', 'Consumer goods', 'Producer goods', 'Intermediate goods'], correctAnswer: 1,
      explanation: 'Consumer goods are purchased for direct use by the final consumer.', difficulty: 'easy',
    },
    {
      subject: 'Commerce', examType: 'JAMB',
      questionText: 'Which institution regulates the stock exchange in Nigeria?',
      options: ['CBN', 'SEC', 'NDIC', 'FIRS'], correctAnswer: 1,
      explanation: 'The Securities and Exchange Commission (SEC) regulates the Nigerian capital market.', difficulty: 'medium',
    },
  ];

  await Question.insertMany(questionsData);

  const subjectCounts = questionsData.reduce((acc, q) => {
    acc[q.subject] = (acc[q.subject] || 0) + 1;
    return acc;
  }, {});

  console.log(`Seeded ${courses.length} courses, ${lessonsData.length} lessons, ${questionsData.length} JAMB questions across ${Object.keys(subjectCounts).length} subjects:`);
  Object.entries(subjectCounts).forEach(([subject, count]) => console.log(`  - ${subject}: ${count}`));

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
