// Test script for organizational service
import { organizationalPolicyMissionService } from './src/services/organizationalPolicyMissionService.js';

async function testService() {
  try {
    console.log('Testing service...');
    
    // Test get missions
    const missions = await organizationalPolicyMissionService.getMissions();
    console.log('Missions:', missions);
    
    // Test get policies
    const policies = await organizationalPolicyMissionService.getPolicies();
    console.log('Policies:', policies);
    
  } catch (error) {
    console.error('Error testing service:', error);
  }
}

testService();
