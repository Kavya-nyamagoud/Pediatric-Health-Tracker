import React, { useEffect, useState, useMemo } from 'react'
import {
  LineChart, Line, Area,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine
} from 'recharts'
import api from '../shared/api'
import '../styles.css'

// Recommended Vaccination Schedule by Age (in months)
const VACCINATION_SCHEDULE = [
  { age: 0, vaccines: ['BCG', 'Hep B1', 'OPV0'] },
  { age: 1, vaccines: ['OPV1', 'IPV1', 'Hep B2', 'DTP1', 'Hib1', 'PCV1', 'Rotavirus1'] },
  { age: 2, vaccines: ['OPV2', 'IPV2', 'DTP2', 'Hib2', 'PCV2', 'Rotavirus2'] },
  { age: 3, vaccines: ['OPV3', 'IPV3', 'DTP3', 'Hib3', 'PCV3'] },
  { age: 6, vaccines: ['Influenza1', 'Typhoid Conjugate Vaccine'] },
  { age: 7, vaccines: ['Influenza2'] },
  { age: 9, vaccines: ['MMR1', 'JE1'] },
  { age: 12, vaccines: ['Hep A1', 'PCV Booster'] },
  { age: 15, vaccines: ['MMR2', 'Varicella1'] },
  { age: 18, vaccines: ['DTP Booster1', 'IPV B1', 'Hib Booster', 'Hep A2'] },
  { age: 24, vaccines: ['Typhoid Conjugate Booster', 'JE2'] }
];

// WHO Growth Standard Data (simplified for demo - should be more comprehensive in production)
const WHO_GROWTH_STANDARDS = {
  boys: {
    height: {
      '3': { p3: 87.4, p15: 90.7, p50: 96.1, p85: 101.2, p97: 104.2 },
      '6': { p3: 95.1, p15: 98.1, p50: 103.3, p85: 108.3, p97: 111.2 },
      '9': { p3: 99.8, p15: 102.9, p50: 108.2, p85: 113.3, p97: 116.2 },
      '12': { p3: 103.3, p15: 106.6, p50: 112.0, p85: 117.3, p97: 120.3 },
      '18': { p3: 108.5, p15: 111.9, p50: 117.4, p85: 122.9, p97: 126.0 },
      '24': { p3: 112.4, p15: 115.9, p50: 121.7, p85: 127.4, p97: 130.7 },
    },
    weight: {
      '3': { p3: 4.4, p15: 5.0, p50: 6.0, p85: 7.2, p97: 8.0 },
      '6': { p3: 6.4, p15: 7.1, p50: 8.0, p85: 9.0, p97: 9.8 },
      '9': { p3: 7.3, p15: 7.9, p50: 8.9, p85: 10.0, p97: 10.9 },
      '12': { p3: 7.8, p15: 8.5, p50: 9.6, p85: 10.8, p97: 11.8 },
      '18': { p3: 8.8, p15: 9.7, p50: 10.9, p85: 12.3, p97: 13.4 },
      '24': { p3: 9.7, p15: 10.6, p50: 12.0, p85: 13.6, p97: 14.8 },
    },
    bmi: {
      '3': { p3: 14.0, p15: 14.5, p50: 15.5, p85: 16.8, p97: 17.8 },
      '6': { p3: 15.0, p15: 15.5, p50: 16.5, p85: 17.8, p97: 18.8 },
      '9': { p3: 15.2, p15: 15.8, p50: 16.8, p85: 18.2, p97: 19.3 },
      '12': { p3: 15.3, p15: 15.9, p50: 16.9, p85: 18.4, p97: 19.5 },
      '18': { p3: 15.1, p15: 15.7, p50: 16.8, p85: 18.4, p97: 19.7 },
      '24': { p3: 14.8, p15: 15.4, p50: 16.6, p85: 18.3, p97: 19.7 },
    }
  },
  girls: {
    height: {
      '3': { p3: 85.4, p15: 88.7, p50: 94.0, p85: 99.2, p97: 102.3 },
      '6': { p3: 93.5, p15: 96.7, p50: 101.9, p85: 107.0, p97: 110.0 },
      '9': { p3: 98.1, p15: 101.4, p50: 106.7, p85: 112.0, p97: 115.0 },
      '12': { p3: 101.6, p15: 105.0, p50: 110.5, p85: 115.9, p97: 119.0 },
      '18': { p3: 106.9, p15: 110.4, p50: 116.2, p85: 121.9, p97: 125.2 },
      '24': { p3: 110.9, p15: 114.6, p50: 120.6, p85: 126.6, p97: 130.1 },
    },
    weight: {
      '3': { p3: 4.0, p15: 4.6, p50: 5.5, p85: 6.6, p97: 7.5 },
      '6': { p3: 5.8, p15: 6.4, p50: 7.3, p85: 8.3, p97: 9.0 },
      '9': { p3: 6.8, p15: 7.3, p50: 8.2, p85: 9.3, p97: 10.1 },
      '12': { p3: 7.2, p15: 7.9, p50: 8.9, p85: 10.1, p97: 11.0 },
      '18': { p3: 8.1, p15: 8.9, p50: 10.2, p85: 11.7, p97: 12.9 },
      '24': { p3: 9.0, p15: 9.8, p50: 11.2, p85: 13.0, p97: 14.3 },
    },
    bmi: {
      '3': { p3: 13.5, p15: 14.0, p50: 15.0, p85: 16.3, p97: 17.3 },
      '6': { p3: 14.5, p15: 15.0, p50: 16.0, p85: 17.3, p97: 18.3 },
      '9': { p3: 14.8, p15: 15.3, p50: 16.3, p85: 17.7, p97: 18.8 },
      '12': { p3: 14.9, p15: 15.5, p50: 16.5, p85: 18.0, p97: 19.2 },
      '18': { p3: 14.7, p15: 15.3, p50: 16.4, p85: 18.0, p97: 19.4 },
      '24': { p3: 14.4, p15: 15.0, p50: 16.2, p85: 18.0, p97: 19.5 },
    }
  }
};

// Helper function to get WHO data for a specific age in months
const getWHODataForAge = (ageInMonths, gender, measurement) => {
  // Ensure age is within valid range (0-24 months)
  const roundedAge = Math.min(24, Math.max(0, Math.round(ageInMonths)));
  
  // For ages not in the standard data (3,6,9,12,18,24 months), interpolate between the nearest values
  if (WHO_GROWTH_STANDARDS[gender]?.[measurement]) {
    const standardAges = Object.keys(WHO_GROWTH_STANDARDS[gender][measurement])
      .map(Number)
      .sort((a, b) => a - b);
    
    if (standardAges.length === 0) return null;
    
    // Find the nearest lower and higher ages in the standard data
    let lowerAge = standardAges[0];
    let higherAge = standardAges[standardAges.length - 1];
    
    for (const age of standardAges) {
      if (age <= roundedAge) lowerAge = age;
      if (age >= roundedAge && age < higherAge) higherAge = age;
    }
    
    // If we have exact match, return it
    if (lowerAge === higherAge) {
      return WHO_GROWTH_STANDARDS[gender][measurement][lowerAge];
    }
    
    // Otherwise interpolate between the two nearest values
    const lowerData = WHO_GROWTH_STANDARDS[gender][measurement][lowerAge];
    const higherData = WHO_GROWTH_STANDARDS[gender][measurement][higherAge];
    
    if (!lowerData || !higherData) return lowerData || higherData;
    
    // Linear interpolation
    const ratio = (roundedAge - lowerAge) / (higherAge - lowerAge);
    const interpolatedData = {};
    
    Object.keys(lowerData).forEach(key => {
      if (typeof lowerData[key] === 'number' && typeof higherData[key] === 'number') {
        interpolatedData[key] = parseFloat((lowerData[key] + (higherData[key] - lowerData[key]) * ratio).toFixed(1));
      }
    });
    
    return interpolatedData;
  }
  
  return null;
};

// Style for stat cards
const statCardStyle = (bgColor) => ({
  backgroundColor: bgColor,
  padding: '1rem',
  borderRadius: '8px',
  textAlign: 'center',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  '& h4': {
    margin: '0 0 0.5rem 0',
    fontSize: '0.9rem',
    color: '#555'
  }
});

export default function Analytics({ addNotification }) {
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [growthData, setGrowthData] = useState([])
  const [vaccinationStats, setVaccinationStats] = useState([])
  const [allRecords, setAllRecords] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [riskLevel, setRiskLevel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ----- helpers -----
  const getRecommendationArray = (pred) => {
    if (!pred || pred.recommendation == null) return []
    if (Array.isArray(pred.recommendation)) return pred.recommendation
    // if it's a string or something else – wrap it
    return [String(pred.recommendation)]
  }

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      processChildData(selectedChildId)
      loadPrediction(selectedChildId)
    }
  }, [selectedChildId, allRecords])

  // 🔔 Watch prediction → compute risk → trigger notifications
  useEffect(() => {
    if (!prediction) {
      setRiskLevel(null)
      return
    }

    const recArray = getRecommendationArray(prediction)
    if (recArray.length === 0) {
      setRiskLevel(null)
      return
    }

    const text = recArray.join(' ')
    let level = 'low'
    if (text.includes('🔴')) {
      level = 'high'
    } else if (text.includes('⚠️')) {
      level = 'medium'
    }

    setRiskLevel(level)

    if (!addNotification) return

    if (level === 'high') {
      addNotification(
        '🚨 High growth risk detected for this child. Please consult a pediatrician.',
        'critical'
      )
    } else if (level === 'medium') {
      addNotification(
        '⚠️ Growth is slightly below typical trend. Monitor diet, sleep and regular checkups.',
        'warning'
      )
    }
  }, [prediction, addNotification])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const childRes = await api.get('/children')
      setChildren(childRes.data)

      if (childRes.data.length > 0) {
        setSelectedChildId(childRes.data[0].id)

        // Load all records for all children
        let records = []
        for (const child of childRes.data) {
          try {
            const recordRes = await api.get(`/health?childId=${child.id}&limit=100`)
            records = records.concat(
              (recordRes.data.records || []).map(r => ({
                ...r,
                childName: `${child.firstName} ${child.lastName}`
              }))
            )
          } catch (e) {
            console.error(`Failed to fetch records for child ${child.id}`)
          }
        }
        setAllRecords(records)
      }
      setError('')
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const loadPrediction = async (childId) => {
    try {
      const res = await api.post('/health/predict/growth', { childId })
      setPrediction(res.data)
    } catch (err) {
      console.error('Failed to load prediction:', err)
      setPrediction(null)
    }
  }

  const processChildData = (childId) => {
    const childRecords = allRecords.filter(r => r.childId === childId);
    const child = children.find(c => c.id === childId);
    
    if (!child) return;

    // Process vaccination data
    const currentDate = new Date();
    const birthDate = new Date(child.dateOfBirth);
    const ageInMonths = Math.floor((currentDate - birthDate) / (1000 * 60 * 60 * 24 * 30.44));
    
    // Get all recommended vaccines up to current age by age group
    const recommendedVaccinesByAge = VACCINATION_SCHEDULE
      .filter(v => v.age <= ageInMonths);
    
    // Flatten all recommended vaccines up to current age
    const allRecommendedVaccines = recommendedVaccinesByAge.flatMap(v => v.vaccines);
    
    // Get actual vaccinations (grouped by vaccine name to handle duplicates)
    const actualVaccines = {};
    childRecords
      .filter(r => r.type === 'vaccination' && r.vaccination)
      .forEach(r => {
        actualVaccines[r.vaccination] = (actualVaccines[r.vaccination] || 0) + 1;
      });
    
    // Calculate missed vaccines by checking each recommended vaccine
    const missedVaccines = [];
    const takenVaccines = [];
    
    // Check each recommended vaccine
    recommendedVaccinesByAge.forEach(ageGroup => {
      ageGroup.vaccines.forEach(vaccine => {
        if (actualVaccines[vaccine] > 0) {
          actualVaccines[vaccine]--; // Mark one dose as taken
          takenVaccines.push(vaccine);
        } else {
          missedVaccines.push(vaccine);
        }
      });
    });
    
    // Get upcoming vaccines (next 3 months)
    const upcomingVaccines = VACCINATION_SCHEDULE
      .filter(v => v.age > ageInMonths && v.age <= ageInMonths + 3)
      .flatMap(v => v.vaccines);

    // Calculate age in months for each record
    const growthRecords = childRecords
      .filter(r => r.type === 'growth')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(r => {
        const recordDate = new Date(r.createdAt);
        const birthDate = new Date(child.dateOfBirth);
        const ageInMonths = Math.round(
          (recordDate - birthDate) / (1000 * 60 * 60 * 24 * 30.44)
        );
        
        const gender = child.gender?.toLowerCase() === 'female' ? 'girls' : 'boys';
        const whoHeightData = getWHODataForAge(ageInMonths, gender, 'height');
        const whoWeightData = getWHODataForAge(ageInMonths, gender, 'weight');
        const whoBMIData = getWHODataForAge(ageInMonths, gender, 'bmi');
        
        // Calculate BMI if not provided
        const bmi = r.bmi || (r.height && r.weight 
          ? parseFloat((r.weight / ((r.height / 100) ** 2)).toFixed(1)) 
          : null);
        
        const record = {
          date: recordDate.toLocaleDateString(),
          ageInMonths,
          height: r.height ? parseFloat(r.height.toFixed(1)) : null,
          weight: r.weight ? parseFloat(r.weight.toFixed(1)) : null,
          bmi,
          headCircumference: r.headCircumference || null,
        };
        
        // Add WHO percentiles if data is available
        if (whoHeightData) {
          record.whoHeightP3 = whoHeightData.p3;
          record.whoHeightP15 = whoHeightData.p15;
          record.whoHeightP50 = whoHeightData.p50;
          record.whoHeightP85 = whoHeightData.p85;
          record.whoHeightP97 = whoHeightData.p97;
        }
        
        if (whoWeightData) {
          record.whoWeightP3 = whoWeightData.p3;
          record.whoWeightP15 = whoWeightData.p15;
          record.whoWeightP50 = whoWeightData.p50;
          record.whoWeightP85 = whoWeightData.p85;
          record.whoWeightP97 = whoWeightData.p97;
        }
        
        if (whoBMIData) {
          record.whoBMIP3 = whoBMIData.p3;
          record.whoBMIP15 = whoBMIData.p15;
          record.whoBMIP50 = whoBMIData.p50;
          record.whoBMIP85 = whoBMIData.p85;
          record.whoBMIP97 = whoBMIData.p97;
        }
        
        // Log the record for debugging
        console.log('Processed growth record:', record);
        return record;
      });
      
    // Log the processed data for debugging
    console.log('All growth records:', growthRecords);
      
    setGrowthData(growthRecords);

    // Helper function to normalize vaccine names for comparison
    const normalizeVaccineName = (name) => {
      if (!name) return '';
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
        .replace(/\s+/g, '')        // Remove all whitespace
        .replace(/dose\s*\d+/i, '') // Remove "dose X" text
        .replace('hepatitisb', 'hepb') // Common abbreviation
        .replace('dtp', 'dtap')       // Common alternative
        .replace('hib', 'h.influenzae'); // Full name
    };
    
    // Process vaccination data for charts and status
    const vaccineCount = {}
    const allAdministeredVaccines = [];
    
    childRecords
      .filter(r => r.type === 'vaccination' && r.vaccination)
      .forEach(r => {
        const vaccine = r.vaccination.trim();
        vaccineCount[vaccine] = (vaccineCount[vaccine] || 0) + 1;
        allAdministeredVaccines.push(vaccine);
      });
    
    console.log('Administered vaccines:', allAdministeredVaccines);
    console.log('Vaccine counts:', vaccineCount);
    
    // Prepare data for vaccination timeline
    const timelineData = VACCINATION_SCHEDULE.map(ageGroup => {
      const dueVaccines = ageGroup.vaccines;
      const takenVaccines = [];
      
      dueVaccines.forEach(vaccine => {
        const normalizedVaccine = normalizeVaccineName(vaccine);
        const match = allAdministeredVaccines.find(administeredVaccine => {
          const normalizedAdministered = normalizeVaccineName(administeredVaccine);
          const isMatch = 
            normalizedAdministered.includes(normalizedVaccine) || 
            normalizedVaccine.includes(normalizedAdministered) ||
            (normalizedVaccine.includes('hepb') && normalizedAdministered.includes('hepatitisb')) ||
            (normalizedVaccine.includes('dtap') && normalizedAdministered.includes('dtp'));
          
          if (isMatch) {
            console.log(`Matched: ${vaccine} (${normalizedVaccine}) with ${administeredVaccine} (${normalizedAdministered})`);
          }
          
          return isMatch;
        });
        
        if (match) {
          takenVaccines.push(vaccine);
        }
      });
      
      console.log(`Age ${ageGroup.age} months:`, {
        dueVaccines,
        takenVaccines,
        count: takenVaccines.length
      });
      
      return {
        age: ageGroup.age,
        due: dueVaccines.length,
        taken: takenVaccines.length,
        missed: dueVaccines.length - takenVaccines.length,
        vaccines: dueVaccines.join(', '),
        takenVaccines: takenVaccines.join(', ')
      };
    });
    
    console.log('Timeline data:', timelineData);
    
    // Calculate total taken vaccines by summing up all taken vaccines from the timeline
    const totalTakenVaccines = timelineData.reduce((sum, item) => sum + item.taken, 0);
    
    // Set vaccination stats with all the processed data
    setVaccinationStats({
      counts: Object.entries(actualVaccines).map(([name, count]) => ({
        name,
        value: count
      })),
      timeline: timelineData,
      status: {
        totalRecommended: allRecommendedVaccines.length,
        taken: totalTakenVaccines, // Use the calculated total from timeline data
        missed: missedVaccines.length,
        upcoming: upcomingVaccines.length,
        missedVaccines,
        upcomingVaccines,
        lastUpdated: new Date().toLocaleDateString()
      }
    });
    
    console.log('Vaccination stats updated:', {
      totalRecommended: allRecommendedVaccines.length,
      taken: totalTakenVaccines,
      missed: missedVaccines.length,
      upcoming: upcomingVaccines.length,
      timelineData: timelineData.map(t => ({
        age: t.age,
        due: t.due,
        taken: t.taken,
        vaccines: t.vaccines,
        takenVaccines: t.takenVaccines
      }))
    });
  }

  if (loading) {
    return (
      <div className="card">
        <p>Loading analytics...</p>
      </div>
    )
  }

  const selectedChild = children.find(c => c.id === selectedChildId)
  const childRecords = allRecords.filter(r => r.childId === selectedChildId)
  const recordTypes = {}
  childRecords.forEach(r => {
    recordTypes[r.type] = (recordTypes[r.type] || 0) + 1
  })

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c']

  // safe recommendations array for rendering
  const recommendations = getRecommendationArray(prediction)

  // Function to get growth indicators for the selected child
  const getGrowthIndicators = () => {
    if (!selectedChild || growthData.length === 0) return [];
    
    // Calculate growth indicators based on WHO percentiles
    const indicators = [
      { 
        indicator: 'Low length for age', 
        value: growthData.some(d => d.height && d.whoHeightP3 && d.height < d.whoHeightP3) ? 'Yes' : 'No'
      },
      { 
        indicator: 'Low weight for age', 
        value: growthData.some(d => d.weight && d.whoWeightP3 && d.weight < d.whoWeightP3) ? 'Yes' : 'No'
      },
      { 
        indicator: 'High weight for length', 
        value: growthData.some(d => d.bmi && d.whoBMIP97 && d.bmi > d.whoBMIP97) ? 'Yes' : 'No'
      },
      { 
        indicator: 'Wasting (low weight for height)', 
        value: growthData.some(d => 
          d.weight && d.height && d.whoWeightP3 && 
          d.whoHeightP50 && (d.weight / d.whoWeightP50) < 0.8
        ) ? 'Yes' : 'No'
      },
      { 
        indicator: 'Stunting (low height for age)', 
        value: growthData.some(d => 
          d.height && d.whoHeightP3 && d.height < d.whoHeightP3
        ) ? 'Yes' : 'No'
      }
    ];

    return indicators;
  };

  // Sample data for the comparison chart (in a real app, this would come from your data)
  const growthComparisonData = [
    { 
      indicator: 'Low length for age',
      who: 12.3,
      cdc: 9.8
    },
    { 
      indicator: 'Low weight for age',
      who: 8.5,
      cdc: 7.2
    },
    { 
      indicator: 'High weight for length',
      who: 6.2,
      cdc: 8.7
    },
    { 
      indicator: 'Wasting (low weight for height)',
      who: 4.8,
      cdc: 3.9
    },
    { 
      indicator: 'Stunting (low height for age)',
      who: 10.1,
      cdc: 8.5
    }
  ];

  const growthIndicators = getGrowthIndicators();

  return (
    <div className="analytics-page">
      <h2>Growth Indicators &amp; Analytics</h2>

      {selectedChild && (
        <p className="small muted" style={{ marginBottom: '1.5rem' }}>
          Showing analytics for: <strong>{selectedChild.firstName} {selectedChild.lastName}</strong>
        </p>
      )}

      {error && <div className="error">{error}</div>}

      {children.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p className="small muted">No children to analyze. Add a child first to view analytics.</p>
        </div>
      ) : (
        <>
          {/* Child Selector */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <label
              htmlFor="child-select"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
            >
              Select Child:
            </label>
            <select
              id="child-select"
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(parseInt(e.target.value))}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '100%',
                maxWidth: '300px'
              }}
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Growth Risk Alert Card */}
          {riskLevel && (
            <div
              className="card"
              style={{
                marginBottom: '1.5rem',
                borderLeft:
                  riskLevel === 'high'
                    ? '4px solid #dc3545'
                    : riskLevel === 'medium'
                    ? '4px solid #ffc107'
                    : '4px solid #28a745',
                backgroundColor: '#fdfdfd'
              }}
            >
              <h3>🚨 Growth Risk Alert</h3>
              <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                Risk Level:{' '}
                <strong style={{ textTransform: 'capitalize' }}>{riskLevel}</strong>
              </p>
              {riskLevel === 'high' && (
                <p className="small" style={{ color: '#dc3545' }}>
                  AI detects concerning growth patterns. Please consult a pediatrician as soon as possible.
                </p>
              )}
              {riskLevel === 'medium' && (
                <p className="small" style={{ color: '#856404' }}>
                  Growth is slightly below typical trend. Monitor diet, sleep and regular checkups.
                </p>
              )}
              {riskLevel === 'low' && (
                <p className="small" style={{ color: '#155724' }}>
                  Growth appears within a healthy range based on the available data.
                </p>
              )}
            </div>
          )}

          {/* Stats Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}
          >
            <div className="card">
              <p className="small muted">Total Records</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                {childRecords.length}
              </p>
            </div>
            <div className="card">
              <p className="small muted">Growth Records</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                {recordTypes['growth'] || 0}
              </p>
            </div>
            <div className="card">
              <p className="small muted">Vaccinations</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
                {recordTypes['vaccination'] || 0}
              </p>
            </div>
            <div className="card">
              <p className="small muted">Other Records</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6c757d' }}>
                {(recordTypes['visit'] || 0) + (recordTypes['med'] || 0)}
              </p>
            </div>
          </div>

          {/* AI Growth Prediction */}
          {prediction && prediction.status === 'success' && (
            <div
              className="card"
              style={{ marginBottom: '2rem', backgroundColor: '#f0f8ff', borderLeft: '4px solid #007bff' }}
            >
              <h3>🤖 AI Growth Prediction</h3>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                Confidence Level:{' '}
                <strong style={{ textTransform: 'capitalize' }}>
                  {prediction.confidenceLevel}
                </strong>
              </p>

              {/* Trends */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '4px' }}>
                  <p className="small muted">Height Growth Rate</p>
                  <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0066cc' }}>
                    {prediction.trends.heightTrendCmPerMonth > 0 ? '↗' : '↘'}{' '}
                    {Math.abs(prediction.trends.heightTrendCmPerMonth)} cm/month
                  </p>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '4px' }}>
                  <p className="small muted">Weight Growth Rate</p>
                  <p style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0066cc' }}>
                    {prediction.trends.weightTrendKgPerMonth > 0 ? '↗' : '↘'}{' '}
                    {Math.abs(prediction.trends.weightTrendKgPerMonth)} kg/month
                  </p>
                </div>
              </div>

              {/* Predictions */}
              {prediction.nextMonthPrediction?.predictedHeight && (
                <div
                  style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#fff',
                    borderRadius: '4px'
                  }}
                >
                  <p className="small muted">Next Month Prediction</p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                        Height:{' '}
                        <strong>
                          {prediction.nextMonthPrediction.predictedHeight} cm
                        </strong>
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                        Weight:{' '}
                        <strong>
                          {prediction.nextMonthPrediction.predictedWeight} kg
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Growth Analysis */}
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#fff',
                  borderRadius: '4px'
                }}
              >
                <p className="small muted">Growth Analysis</p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  Total Height Gain:{' '}
                  <strong>
                    {prediction.growthAnalysis.totalHeightGain.toFixed(1)} cm
                  </strong>{' '}
                  over {prediction.growthAnalysis.recordsCount} records
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  Total Weight Gain:{' '}
                  <strong>
                    {prediction.growthAnalysis.totalWeightGain.toFixed(2)} kg
                  </strong>
                </p>
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '4px' }}>
                  <p className="small muted">Health Recommendations</p>
                  {recommendations.map((rec, idx) => (
                    <p key={idx} style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                      {rec}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Insufficient Data Message */}
          {prediction && prediction.status === 'insufficient_data' && (
            <div
              className="card"
              style={{ marginBottom: '2rem', backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107' }}
            >
              <h3>📊 AI Growth Prediction</h3>
              <p style={{ color: '#856404' }}>{prediction.message}</p>
              {prediction.recommendation && (
                <p style={{ color: '#856404', fontSize: '0.9rem' }}>
                  {String(prediction.recommendation)}
                </p>
              )}
            </div>
          )}

          {/* Height Growth Chart with WHO Standards */}
          {growthData.length > 0 && growthData.some(d => d.height) && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3>Height Growth</h3>
              <p className="small muted" style={{ marginBottom: '1rem' }}>
                Comparison with WHO {selectedChild?.gender?.toLowerCase() === 'female' ? 'girls' : 'boys'} standards
              </p>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="ageInMonths"
                    label={{ value: 'Age (months)', position: 'insideBottomRight', offset: -10 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Height (cm)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                    domain={[0, dataMax => Math.ceil((dataMax * 1.2) / 10) * 10]}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Child') {
                        return [value, <span>Child's Height: <strong>{value} cm</strong></span>];
                      }
                      return [value, <span>WHO Average: <strong>{value} cm</strong></span>];
                    }}
                    labelFormatter={(label) => `Age: ${label} months`}
                  />
                  
                  {/* WHO 50th Percentile (Average) */}
                  <Bar 
                    dataKey="whoHeightP50" 
                    name="WHO Average"
                    fill="#06d6a0"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                  
                  {/* Child's Actual Height */}
                  <Bar 
                    dataKey="height" 
                    name="Child"
                    fill="#3a86ff"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                  
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => {
                      if (value === 'Child') return <span style={{ color: '#3a86ff' }}>Child's Height</span>;
                      if (value === 'WHO Average') return <span style={{ color: '#06d6a0' }}>WHO Average</span>;
                      return value;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Current Status */}
              {growthData.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
                  <h4>Current Status</h4>
                  {(() => {
                    const latest = growthData[growthData.length - 1];
                    if (!latest || !latest.height || !latest.whoHeightP50) return null;
                    
                    const diff = latest.height - latest.whoHeightP50;
                    const diffPercent = Math.round((diff / latest.whoHeightP50) * 100);
                    const isAbove = diff > 0;
                    
                    return (
                      <p>
                        At {latest.ageInMonths} months, {selectedChild?.firstName}'s height is 
                        <strong> {Math.abs(diff).toFixed(1)}cm {isAbove ? 'above' : 'below'} </strong> 
                        the WHO average of {latest.whoHeightP50}cm for {selectedChild?.gender?.toLowerCase() === 'female' ? 'girls' : 'boys'}.
                      </p>
                    );
                  })()}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#3a86ff', marginRight: '4px' }}></div>
                  <span className="small">Child's Height</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '1px', backgroundColor: '#ff6b6b', margin: '0 4px' }}></div>
                  <span className="small">WHO 3rd/97th %</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '1px', backgroundColor: '#ffd166', margin: '0 4px' }}></div>
                  <span className="small">WHO 15th/85th %</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '1px', backgroundColor: '#06d6a0', margin: '0 4px' }}></div>
                  <span className="small">WHO 50th %</span>
                </div>
              </div>
            </div>
          )}

          {/* Weight Growth Chart with WHO Standards */}
          {growthData.length > 0 && growthData.some(d => d.weight) && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3>Weight Trend vs WHO Standards</h3>
              <p className="small muted" style={{ marginBottom: '1rem' }}>
                Showing {selectedChild?.gender?.toLowerCase() === 'female' ? 'girls' : 'boys'} growth percentiles
              </p>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="ageInMonths"
                    label={{ value: 'Age (months)', position: 'insideBottomRight', offset: -10 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                    domain={[0, dataMax => Math.ceil((dataMax * 1.2) / 5) * 5]}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Child') {
                        return [value, <span>Child's Weight: <strong>{value} kg</strong></span>];
                      }
                      return [value, <span>WHO Average: <strong>{value} kg</strong></span>];
                    }}
                    labelFormatter={(label) => `Age: ${label} months`}
                  />
                  
                  {/* WHO 50th Percentile (Average) */}
                  <Bar 
                    dataKey="whoWeightP50" 
                    name="WHO Average"
                    fill="#06d6a0"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                  
                  {/* Child's Actual Weight */}
                  <Bar 
                    dataKey="weight" 
                    name="Child"
                    fill="#3a86ff"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                  
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => {
                      if (value === 'Child') return <span style={{ color: '#3a86ff' }}>Child's Weight</span>;
                      if (value === 'WHO Average') return <span style={{ color: '#06d6a0' }}>WHO Average</span>;
                      return value;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#3a86ff', marginRight: '4px' }}></div>
                  <span className="small">Child's Weight</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '1px', backgroundColor: '#ff6b6b', margin: '0 4px' }}></div>
                  <span className="small">WHO 3rd/97th %</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '1px', backgroundColor: '#ffd166', margin: '0 4px' }}></div>
                  <span className="small">WHO 15th/85th %</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '1px', backgroundColor: '#06d6a0', margin: '0 4px' }}></div>
                  <span className="small">WHO 50th %</span>
                </div>
              </div>
            </div>
          )}


          {/* BMI Chart with WHO Standards */}
          {growthData.length > 0 && growthData.some(d => d.bmi) && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3>BMI vs WHO Standards</h3>
              <p className="small muted" style={{ marginBottom: '1rem' }}>
                Showing {selectedChild?.gender?.toLowerCase() === 'female' ? 'girls' : 'boys'} BMI percentiles
              </p>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="ageInMonths"
                    label={{ value: 'Age (months)', position: 'insideBottomRight', offset: -10 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'BMI', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                    domain={[0, dataMax => Math.ceil((dataMax * 1.2) / 5) * 5]}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Child') {
                        return [value, <span>Child's BMI: <strong>{value}</strong></span>];
                      }
                      return [value, <span>WHO Average: <strong>{value}</strong></span>];
                    }}
                    labelFormatter={(label) => `Age: ${label} months`}
                  />
                  
                  {/* WHO 50th Percentile (Average) */}
                  <Bar 
                    dataKey="whoBMIP50" 
                    name="WHO Average"
                    fill="#06d6a0"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                  
                  {/* Child's Actual BMI */}
                  <Bar 
                    dataKey="bmi" 
                    name="Child"
                    fill="#9c27b0"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                  
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => {
                      if (value === 'Child') return <span style={{ color: '#9c27b0' }}>Child's BMI</span>;
                      if (value === 'WHO Average') return <span style={{ color: '#06d6a0' }}>WHO Average</span>;
                      return value;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#9c27b0', marginRight: '4px' }}></div>
                  <span className="small">Child's BMI</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '1px', backgroundColor: '#ff6b6b', margin: '0 4px' }}></div>
                  <span className="small">WHO 3rd/97th %</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '1px', backgroundColor: '#ffd166', margin: '0 4px' }}></div>
                  <span className="small">WHO 15th/85th %</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '1px', backgroundColor: '#06d6a0', margin: '0 4px' }}></div>
                  <span className="small">WHO 50th %</span>
                </div>
              </div>
            </div>
          )}

          {/* Vaccination Overview and Timeline */}
          {vaccinationStats.timeline && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3>Vaccination Schedule & Status</h3>
              
              {/* Vaccination Stats Summary */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={statCardStyle('#e3f2fd')}>
                  <h4>Total Recommended</h4>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{vaccinationStats.status.totalRecommended}</div>
                </div>
                <div style={statCardStyle('#c8e6c9')}>
                  <h4>Vaccines Taken</h4>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{vaccinationStats.status.taken}</div>
                </div>
                <div style={statCardStyle('#ffebee')}>
                  <h4>Missed Vaccines</h4>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{vaccinationStats.status.missed}</div>
                </div>
                <div style={statCardStyle('#fff8e1')}>
                  <h4>Upcoming (Next 3 Months)</h4>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{vaccinationStats.status.upcoming}</div>
                </div>
              </div>

              {/* Vaccination Timeline Chart */}
              <div style={{ marginTop: '2rem' }}>
                <h4>Vaccination Timeline</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={vaccinationStats.timeline}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis 
                      dataKey="age" 
                      label={{ value: 'Age (months)', position: 'insideBottomRight', offset: -10 }}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ value: 'Number of Vaccines', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Due Vaccines') return [value, 'Recommended'];
                        if (name === 'Taken Vaccines') return [value, 'Administered'];
                        return [value, name];
                      }}
                      labelFormatter={(age) => `Age: ${age} months`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="due" 
                      name="Due Vaccines" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="taken" 
                      name="Taken Vaccines" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="missed" 
                      name="Missed Vaccines" 
                      stroke="#ff6b6b" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Vaccination Schedule */}
              <div style={{ marginTop: '2rem' }}>
                <h4>Detailed Vaccination Schedule</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Age (Months)</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Recommended Vaccines</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaccinationStats.timeline.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '12px' }}>{item.age}</td>
                          <td style={{ padding: '12px' }}>{item.vaccines}</td>
                          <td style={{ padding: '12px', color: item.missed > 0 ? '#d32f2f' : '#388e3c' }}>
                            {item.missed === 0 ? '✓ Completed' : `⚠ ${item.missed} pending`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Missed Vaccines Section */}
              {vaccinationStats.status.missed > 0 && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
                  <h4>⚠ Missed Vaccines</h4>
                  <p>The following vaccines are recommended but not yet administered:</p>
                  <ul>
                    {vaccinationStats.status.missedVaccines.map((vaccine, idx) => (
                      <li key={idx}>{vaccine}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upcoming Vaccines Section */}
              {vaccinationStats.status.upcoming > 0 && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                  <h4>🔜 Upcoming Vaccines (Next 3 Months)</h4>
                  <p>Plan for these upcoming vaccines:</p>
                  <ul>
                    {vaccinationStats.status.upcomingVaccines.map((vaccine, idx) => (
                      <li key={idx}>{vaccine}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className="small muted" style={{ marginTop: '1rem', textAlign: 'right' }}>
                Last updated: {vaccinationStats.status.lastUpdated}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
