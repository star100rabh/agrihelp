const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Farmer = require('./models/Farmer');
const Scheme = require('./models/Scheme');
const Application = require('./models/Application');
const CallLog = require('./models/CallLog');
const demoData = require('./data/demoData');

dotenv.config();

const seed = async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.log('Provide MONGO_URI to seed database.');
      process.exit(1);
    }

    await Promise.all([
      Farmer.deleteMany({}),
      Scheme.deleteMany({}),
      Application.deleteMany({}),
      CallLog.deleteMany({}),
    ]);

    const farmers = await Farmer.insertMany(
      demoData.farmers.map((farmer) => ({
        ...farmer,
        aadharNo: farmer.aadharNo || '',
      }))
    );

    const schemes = await Scheme.insertMany(demoData.schemes);

    const rajesh = farmers.find((farmer) => farmer.name === 'Rajesh Kumar');
    const pmKisan = schemes.find((scheme) => scheme.title === 'PM-Kisan Samman Nidhi');
    const kcc = schemes.find((scheme) => scheme.title === 'Kisan Credit Card (KCC)');

    await Application.insertMany([
      {
        farmer: rajesh._id,
        scheme: pmKisan._id,
        applicationNumber: 'APP-4289-092',
        status: 'approved',
        submittedAt: new Date('2026-01-15'),
        timeline: [
          { step: 'Applied', dateLabel: 'Jan 15', status: 'completed' },
          { step: 'Verification', dateLabel: 'Jan 22', status: 'completed' },
          { step: 'Approval', dateLabel: 'Jan 28', status: 'completed' },
          { step: 'Disbursement', dateLabel: 'TBD', status: 'pending' },
        ],
        receiptUrl: 'https://example.org/receipt.pdf',
      },
      {
        farmer: rajesh._id,
        scheme: kcc._id,
        applicationNumber: 'APP-5130-119',
        status: 'verification',
        submittedAt: new Date('2026-02-03'),
        timeline: [
          { step: 'Applied', dateLabel: 'Feb 3', status: 'completed' },
          { step: 'Aadhaar Verification', dateLabel: 'Pending', status: 'in_progress' },
          { step: 'Bank Approval', dateLabel: 'Pending', status: 'pending' },
        ],
      },
    ]);

    await CallLog.insertMany([
      {
        farmer: rajesh._id,
        farmerName: 'Rajesh Kumar',
        callType: 'outbound',
        status: 'completed',
        summary: 'Farmer confirmed intent to apply.',
        nextAction: 'Follow up in 5 days for application id.',
      },
      {
        farmer: rajesh._id,
        farmerName: 'Rajesh Kumar',
        callType: 'follow_up',
        status: 'completed',
        summary: 'Application submitted via CSC. ID collected.',
        nextAction: 'Track verification status and inform farmer.',
      },
    ]);

    console.log('Seed completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
