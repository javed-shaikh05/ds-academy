// Small sample datasets bundled with the app (no hosting needed).
// Each has a CSV string the playground loads into pandas.

export interface Dataset {
    id: string
    name: string
    emoji: string
    domain: string
    difficulty: 'Beginner' | 'Intermediate'
    description: string
    csv: string          // raw CSV data
    columns: string      // human description of columns (for the AI brief)
}

export const DATASETS: Dataset[] = [
    {
        id: 'sales',
        name: 'Retail Sales',
        emoji: '🛒',
        domain: 'Business Analytics',
        difficulty: 'Beginner',
        description: 'Monthly sales data for a small retail chain. Find trends, top products, and insights for the boss.',
        columns: 'date, product, category, units_sold, unit_price, region',
        csv: `date,product,category,units_sold,unit_price,region
2024-01-05,Widget A,Hardware,120,9.99,North
2024-01-12,Widget B,Hardware,85,14.50,South
2024-01-18,Gadget X,Electronics,45,49.99,North
2024-01-25,Gadget Y,Electronics,30,79.99,East
2024-02-03,Widget A,Hardware,150,9.99,North
2024-02-10,Widget B,Hardware,95,14.50,West
2024-02-15,Gadget X,Electronics,60,49.99,South
2024-02-22,Gadget Y,Electronics,40,79.99,North
2024-03-01,Widget A,Hardware,200,9.99,East
2024-03-08,Widget B,Hardware,110,14.50,North
2024-03-14,Gadget X,Electronics,75,49.99,West
2024-03-21,Gadget Y,Electronics,55,79.99,South
2024-03-28,Widget A,Hardware,180,9.99,North
2024-04-04,Gadget X,Electronics,90,49.99,East
2024-04-11,Widget B,Hardware,130,14.50,North
2024-04-18,Gadget Y,Electronics,65,79.99,West
2024-04-25,Widget A,Hardware,220,9.99,South
2024-05-02,Gadget X,Electronics,105,49.99,North
2024-05-09,Widget B,Hardware,140,14.50,East
2024-05-16,Gadget Y,Electronics,70,79.99,North`,
    },
    {
        id: 'titanic',
        name: 'Titanic Survival',
        emoji: '🚢',
        domain: 'Classification',
        difficulty: 'Beginner',
        description: 'The famous Titanic passenger data. Explore who survived and why — a classic first ML problem.',
        columns: 'passenger_id, survived (0/1), pclass (1/2/3), sex, age, fare, embarked',
        csv: `passenger_id,survived,pclass,sex,age,fare,embarked
1,0,3,male,22,7.25,S
2,1,1,female,38,71.28,C
3,1,3,female,26,7.92,S
4,1,1,female,35,53.10,S
5,0,3,male,35,8.05,S
6,0,3,male,27,8.46,Q
7,0,1,male,54,51.86,S
8,0,3,male,2,21.07,S
9,1,3,female,27,11.13,S
10,1,2,female,14,30.07,C
11,1,3,female,4,16.70,S
12,1,1,female,58,26.55,S
13,0,3,male,20,8.05,S
14,0,3,male,39,31.27,S
15,0,3,female,14,7.85,S
16,1,2,female,55,16.00,S
17,0,3,male,2,29.12,Q
18,1,2,male,23,13.00,S
19,0,3,female,31,18.00,S
20,1,3,female,22,7.22,C
21,0,2,male,35,26.00,S
22,1,2,male,34,13.00,S
23,1,3,female,15,8.03,Q
24,1,1,male,28,35.50,S
25,0,3,female,8,21.07,S`,
    },
    {
        id: 'housing',
        name: 'House Prices',
        emoji: '🏠',
        domain: 'Regression',
        difficulty: 'Intermediate',
        description: 'Housing data with features and prices. Predict price and find what drives value.',
        columns: 'area_sqft, bedrooms, bathrooms, age_years, location_score, price_usd',
        csv: `area_sqft,bedrooms,bathrooms,age_years,location_score,price_usd
1200,2,1,15,6,180000
1500,3,2,10,7,250000
900,1,1,25,4,120000
2000,4,3,5,8,380000
1800,3,2,8,7,310000
1100,2,1,20,5,160000
2400,4,3,2,9,450000
1350,3,2,12,6,220000
1650,3,2,7,7,290000
1000,2,1,30,4,140000
2200,4,3,4,8,410000
1450,3,2,11,6,235000
1750,3,2,6,8,330000
1250,2,2,18,5,185000
1950,4,2,9,7,355000
850,1,1,28,3,110000
2100,4,3,3,9,420000
1550,3,2,9,7,270000
1300,2,2,16,6,200000
1850,3,3,7,8,345000`,
    },
]

export function getDataset(id: string): Dataset | undefined {
    return DATASETS.find((d) => d.id === id)
}