const mongoose = require('mongoose');

const seed = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/deployhub');
    
    const deploymentSchema = new mongoose.Schema({
      deploymentId: String,
      projectName: String,
      status: String,
      port: Number,
      publicUrl: String,
      envVars: String,
      gitUrl: String,
    }, { timestamps: true });
    
    const Deployment = mongoose.models.Deployment || mongoose.model('Deployment', deploymentSchema);
    
    console.log('Clearing existing deployments...');
    await Deployment.deleteMany({});
    
    const dummyData = [
      {
        deploymentId: 'dep-1234',
        projectName: 'ecomm-website',
        status: 'RUNNING',
        port: 3001,
        publicUrl: 'http://ecomm-website.localhost',
        gitUrl: 'https://github.com/anshgedia03/Ecomm_website.git',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        updatedAt: new Date(),
      },
      {
        deploymentId: 'dep-5678',
        projectName: 'my-portfolio',
        status: 'BUILDING',
        port: null,
        publicUrl: null,
        gitUrl: 'https://github.com/johndoe/portfolio.git',
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
        updatedAt: new Date(),
      },
      {
        deploymentId: 'dep-9999',
        projectName: 'old-zip-project',
        status: 'STOPPED',
        port: 3002,
        publicUrl: 'http://old-zip-project.localhost',
        gitUrl: undefined,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        updatedAt: new Date(),
      },
      {
        deploymentId: 'dep-0000',
        projectName: 'failing-app',
        status: 'FAILED',
        port: null,
        publicUrl: null,
        gitUrl: 'https://github.com/someuser/broken-app',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        updatedAt: new Date(),
      }
    ];

    console.log('Inserting dummy data...');
    await Deployment.insertMany(dummyData);
    console.log('Successfully seeded database with dummy deployments!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed();
