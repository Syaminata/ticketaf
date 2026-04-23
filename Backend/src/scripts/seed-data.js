/**
 * Script de remplissage de la base de données avec des données de test
 * Usage: npm run seed
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Driver = require('../models/driver.model');
const Ville = require('../models/ville.model');
const Voyage = require('../models/voyage.model');
const Bus = require('../models/bus.model');

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/ticketaf';
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
    process.exit(1);
  }
};

const seedVilles = async (adminUserId) => {
  console.log('\n📍 Création des villes...');

  const villes = [
    { nom: 'Dakar', createdBy: adminUserId },
    { nom: 'Thiès', createdBy: adminUserId },
    { nom: 'Kaolack', createdBy: adminUserId },
    { nom: 'Tambacounda', createdBy: adminUserId },
    { nom: 'Saint-Louis', createdBy: adminUserId },
    { nom: 'Ziguinchor', createdBy: adminUserId },
    { nom: 'Kolda', createdBy: adminUserId },
    { nom: 'Fatick', createdBy: adminUserId },
    { nom: 'Touba', createdBy: adminUserId },
    { nom: 'Kaédi', createdBy: adminUserId },
    { nom: 'Matam', createdBy: adminUserId },
    { nom: 'Kidira', createdBy: adminUserId },
    { nom: 'Koumpentoum', createdBy: adminUserId },
    { nom: 'Vélingara', createdBy: adminUserId },
    { nom: 'Saraya', createdBy: adminUserId },
    { nom: 'Siguiri', createdBy: adminUserId },
    { nom: 'Kédougou', createdBy: adminUserId },
    { nom: 'Diouloulou', createdBy: adminUserId },
    { nom: 'Bakel', createdBy: adminUserId },
    { nom: 'Podor', createdBy: adminUserId },
    { nom: 'Linguère', createdBy: adminUserId },
    { nom: 'Louga', createdBy: adminUserId },
    { nom: 'Birkelane', createdBy: adminUserId },
    { nom: 'Coki', createdBy: adminUserId },
    { nom: 'Guinguinéo', createdBy: adminUserId },
    { nom: 'Gossas', createdBy: adminUserId },
    { nom: 'Nioro du Rip', createdBy: adminUserId },
    { nom: 'Medina Yoro Foulah', createdBy: adminUserId },
    { nom: 'Kasnénédi', createdBy: adminUserId },
    { nom: 'Sedhiou', createdBy: adminUserId },
  ];

  try {
    await Ville.deleteMany({});
    const createdVilles = await Ville.insertMany(villes);
    console.log(`✅ ${createdVilles.length} villes créées`);
    return createdVilles;
  } catch (err) {
    console.error('❌ Erreur lors de la création des villes:', err.message);
  }
};

const seedUsers = async () => {
  console.log('\n👥 Création des utilisateurs de test...');

  const hashedPassword = await bcrypt.hash('Test@1234', 10);

  const users = [
    {
      name: 'Admin Test',
      email: 'admin@test.com',
      numero: '771234567',
      password: hashedPassword,
      role: 'admin',
      address: 'Dakar, Sénégal',
    },
    {
      name: 'Client Test 1',
      email: 'client1@test.com',
      numero: '781234567',
      password: hashedPassword,
      role: 'client',
      address: 'Thiès, Sénégal',
    },
    {
      name: 'Client Test 2',
      email: 'client2@test.com',
      numero: '761234567',
      password: hashedPassword,
      role: 'client',
      address: 'Kaolack, Sénégal',
    },
  ];

  try {
    await User.deleteMany({});
    const createdUsers = await User.insertMany(users);
    console.log(`✅ ${createdUsers.length} utilisateurs créés`);
    return createdUsers;
  } catch (err) {
    console.error('❌ Erreur lors de la création des utilisateurs:', err.message);
  }
};

const seedDrivers = async () => {
  console.log('\n🚗 Création des conducteurs de test...');

  const hashedPassword = await bcrypt.hash('Driver@1234', 10);

  const drivers = [
    {
      name: 'Conducteur Test 1',
      email: 'driver1@test.com',
      numero: '771111111',
      password: hashedPassword,
      role: 'conducteur',
      address: 'Dakar, Sénégal',
      matricule: 'SN-001-2024',
      marque: 'Toyota Camry',
      capacity: 4,
      capacity_coffre: 'moyen',
      climatisation: true,
      wifi: true,
      isActive: true,
      permis: [],
      photo: [],
    },
    {
      name: 'Conducteur Test 2',
      email: 'driver2@test.com',
      numero: '772222222',
      password: hashedPassword,
      role: 'conducteur',
      address: 'Thiès, Sénégal',
      matricule: 'SN-002-2024',
      marque: 'Mercedes Sprinter',
      capacity: 14,
      capacity_coffre: 'grand',
      climatisation: true,
      wifi: false,
      isActive: true,
      permis: [],
      photo: [],
    },
  ];

  try {
    await Driver.deleteMany({});
    const createdDrivers = await Driver.insertMany(drivers);

    // Créer aussi les utilisateurs associés
    const driverUsers = drivers.map(driver => ({
      name: driver.name,
      email: driver.email,
      numero: driver.numero,
      password: driver.password,
      role: 'conducteur',
      address: driver.address,
    }));

    const createdUsers = await User.insertMany(driverUsers);
    console.log(`✅ ${createdDrivers.length} conducteurs créés`);
    return { drivers: createdDrivers, users: createdUsers };
  } catch (err) {
    console.error('❌ Erreur lors de la création des conducteurs:', err.message);
  }
};

const seedVoyages = async (drivers) => {
  console.log('\n✈️ Création des voyages de test...');
  
  if (!drivers || drivers.length === 0) {
    console.log('⚠️ Pas de conducteurs disponibles pour créer des voyages');
    return;
  }

  const voyages = [];
  
  const routes = [
    { from: 'Dakar', to: 'Thiès', price: 5000, seats: 4 },
    { from: 'Dakar', to: 'Kaolack', price: 10000, seats: 4 },
    { from: 'Dakar', to: 'Tambacounda', price: 18000, seats: 4 },
    { from: 'Dakar', to: 'Saint-Louis', price: 12000, seats: 4 },
    { from: 'Dakar', to: 'Ziguinchor', price: 15000, seats: 4 },
    { from: 'Dakar', to: 'Kolda', price: 12000, seats: 4 },
    { from: 'Dakar', to: 'Touba', price: 8000, seats: 4 },
    { from: 'Thiès', to: 'Kaolack', price: 6000, seats: 4 },
    { from: 'Thiès', to: 'Tambacounda', price: 15000, seats: 4 },
    { from: 'Thiès', to: 'Saint-Louis', price: 10000, seats: 4 },
    { from: 'Kaolack', to: 'Ziguinchor', price: 8000, seats: 4 },
    { from: 'Kaolack', to: 'Kolda', price: 5000, seats: 4 },
    { from: 'Tambacounda', to: 'Saint-Louis', price: 8000, seats: 4 },
    { from: 'Ziguinchor', to: 'Kolda', price: 7000, seats: 4 },
    { from: 'Saint-Louis', to: 'Podor', price: 4000, seats: 4 },
    { from: 'Kaolack', to: 'Tambacounda', price: 12000, seats: 4 },
    { from: 'Touba', to: 'Kaolack', price: 8000, seats: 4 },
    { from: 'Fatick', to: 'Ziguinchor', price: 9000, seats: 4 },
    { from: 'Louga', to: 'Saint-Louis', price: 3000, seats: 4 },
    { from: 'Kédougou', to: 'Kolda', price: 6000, seats: 4 },
  ];

  // Créer multiple voyages pour chaque route avec différentes dates et conducteurs
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const daysToAdd = 2 + (i % 7);
    
    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const voyageDate = new Date(Date.now() + (daysToAdd + dayOffset * 7) * 24 * 60 * 60 * 1000);
      const driver = drivers[i % drivers.length];
      const availableSeats = route.seats - (Math.floor(Math.random() * 2));
      
      voyages.push({
        from: route.from,
        to: route.to,
        date: voyageDate,
        price: route.price,
        totalSeats: route.seats,
        availableSeats: availableSeats,
        driver: driver._id,
        description: `Trajet ${route.from} - ${route.to} avec climatisation et arrêts réguliers`,
      });
    }
  }

  try {
    await Voyage.deleteMany({});
    const createdVoyages = await Voyage.insertMany(voyages);
    console.log(`✅ ${createdVoyages.length} voyages créés`);
    return createdVoyages;
  } catch (err) {
    console.error('❌ Erreur lors de la création des voyages:', err.message);
  }
};

const seedBuses = async (drivers) => {
  console.log('\n🚌 Création des bus de test...');

  const busRoutes = [
    { from: 'Dakar', to: 'Thiès', price: 3000, capacity: 50 },
    { from: 'Dakar', to: 'Kaolack', price: 8000, capacity: 45 },
    { from: 'Dakar', to: 'Tambacounda', price: 15000, capacity: 60 },
    { from: 'Dakar', to: 'Saint-Louis', price: 12000, capacity: 50 },
    { from: 'Dakar', to: 'Ziguinchor', price: 14000, capacity: 52 },
    { from: 'Dakar', to: 'Kolda', price: 12000, capacity: 48 },
    { from: 'Dakar', to: 'Touba', price: 8000, capacity: 50 },
    { from: 'Thiès', to: 'Kaolack', price: 5500, capacity: 48 },
    { from: 'Thiès', to: 'Tambacounda', price: 13000, capacity: 50 },
    { from: 'Thiès', to: 'Saint-Louis', price: 10000, capacity: 48 },
    { from: 'Kaolack', to: 'Ziguinchor', price: 7500, capacity: 46 },
    { from: 'Kaolack', to: 'Kolda', price: 4500, capacity: 44 },
    { from: 'Kaolack', to: 'Fatick', price: 3000, capacity: 42 },
    { from: 'Tambacounda', to: 'Matam', price: 5000, capacity: 50 },
    { from: 'Tambacounda', to: 'Saint-Louis', price: 8000, capacity: 48 },
    { from: 'Ziguinchor', to: 'Kolda', price: 6500, capacity: 48 },
    { from: 'Ziguinchor', to: 'Sedhiou', price: 5000, capacity: 46 },
    { from: 'Saint-Louis', to: 'Podor', price: 3500, capacity: 40 },
    { from: 'Saint-Louis', to: 'Louga', price: 4000, capacity: 45 },
    { from: 'Kolda', to: 'Vélingara', price: 4000, capacity: 44 },
    { from: 'Touba', to: 'Kaolack', price: 7000, capacity: 48 },
    { from: 'Kaolack', to: 'Tambacounda', price: 12000, capacity: 50 },
  ];

  const companies = [
    { name: 'Express Transport', phone: '+221771234567' },
    { name: 'Confort Voyage', phone: '+221772345678' },
    { name: 'Trans Sénégal', phone: '+221773456789' },
    { name: 'Rapid Transport', phone: '+221774567890' },
    { name: 'Grand Voyage', phone: '+221775678901' },
    { name: 'Premium Travel', phone: '+221776789012' },
    { name: 'Direct Express', phone: '+221777890123' },
    { name: 'Comfort Ligne', phone: '+221778901234' },
    { name: 'Express Plus', phone: '+221779012345' },
    { name: 'Route Express', phone: '+221780123456' },
  ];

  const buses = [];
  let busIndex = 1;

  // Créer plusieurs départs pour chaque route avec différentes dates
  for (let i = 0; i < busRoutes.length; i++) {
    const route = busRoutes[i];
    const company = companies[i % companies.length];

    // Créer 3 départs par route (à J+1, J+3, J+5)
    for (let dayOffset = 1; dayOffset <= 5; dayOffset += 2) {
      const departureDate = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
      const availableSeats = Math.max(route.capacity - Math.floor(Math.random() * 20) - 5, 10);
      const priceVariation = Math.floor(Math.random() * 1000) - 500; // +/- 500

      // Varier les équipements: climatisé+wifi, climatisé seul, wifi seul, rien
      const equipVariant = (i + dayOffset) % 4;
      const hasClim = equipVariant === 0 || equipVariant === 1; // 50% climatisé
      const hasWifi = equipVariant === 0 || equipVariant === 2; // 50% wifi

      buses.push({
        name: `${company.name} ${route.from}-${route.to}`,
        plateNumber: `SN-${route.from.substring(0, 2).toUpperCase()}${route.to.substring(0, 2).toUpperCase()}-${2024 + Math.floor(dayOffset / 2)}-${String(busIndex).padStart(3, '0')}`,
        capacity: route.capacity,
        availableSeats: availableSeats,
        from: route.from,
        to: route.to,
        departureDate: departureDate,
        price: route.price + priceVariation,
        company: company.name,
        phone: company.phone,
        climatisation: hasClim,
        wifi: hasWifi,
        isActive: true,
      });

      busIndex++;
    }
  }

  try {
    await Bus.deleteMany({});
    const createdBuses = await Bus.insertMany(buses);
    console.log(`✅ ${createdBuses.length} bus créés`);
    return createdBuses;
  } catch (err) {
    console.error('❌ Erreur lors de la création des bus:', err.message);
  }
};

const main = async () => {
  try {
    console.log('🌱 Démarrage du seed data...\n');

    await connectDB();

    // Créer les utilisateurs d'abord
    const users = await seedUsers();
    const adminUserId = users?.[0]?._id;

    // Puis créer les villes avec l'ID de l'admin
    if (adminUserId) {
      await seedVilles(adminUserId);
    }

    const driverData = await seedDrivers();
    const drivers = driverData?.drivers || [];

    await seedVoyages(drivers);
    await seedBuses(drivers);
    
    console.log('\n✅ Seed data complété avec succès!\n');
    console.log('📊 Statistiques:');
    console.log('   📍 Villes: 30');
    console.log('   ✈️ Voyages covoiturage: 60');
    console.log('   🚌 Bus: 66 (22 routes avec 3 départs chacun)');
    console.log('   👥 Utilisateurs: 5 (1 admin + 2 clients + 2 conducteurs)');
    console.log('\n📝 Comptes de test:');
    console.log('   Admin: admin@test.com (mot de passe: Test@1234)');
    console.log('   Client 1: client1@test.com (mot de passe: Test@1234)');
    console.log('   Client 2: client2@test.com (mot de passe: Test@1234)');
    console.log('   Conducteur 1: driver1@test.com (mot de passe: Driver@1234)');
    console.log('   Conducteur 2: driver2@test.com (mot de passe: Driver@1234)');
    console.log('\n🚀 API disponible à: http://localhost:3000/api\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur générale:', err);
    process.exit(1);
  }
};

main();
