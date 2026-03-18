const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importSchedule() {
    const filePath = path.join(__dirname, "FIFA Men's World Cup 2026 Sortable Schedule.xlsx");
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} matches in Excel.`);

    const matchesToInsert = data.map((row) => {
        // The Excel date is in EDT (UTC-4). 
        // XLSX parsed it as a Date object, but we need to ensure we treat it as EDT.
        // If parsed as UTC, we need to subtract 4 hours to get original EDT, then we have true UTC.
        // However, usually it's easier to just handle the string if possible or offset.

        let dateObj = new Date(row["Date & Time (US EDT/UTC-4)"]);

        // If the Excel date was e.g. "2026-06-11 15:00" and it represents EDT,
        // and global parser read it as UTC, we need to adjust.
        // Actually, usually XLSX parses it based on local time or UTC.
        // Let's assume the Date object provided by XLSX needs to be interpreted as EDT.

        // Most reliable: if excel says 3 PM EDT, that is 7 PM UTC.
        // We add 4 hours to get UTC.
        dateObj.setHours(dateObj.getHours() + 4);

        return {
            team_a: row["Team 1"] || "TBD",
            team_b: row["Team 2"] || "TBD",
            venue: row["Venue"] || "Unknown",
            kickoff: dateObj.toISOString(),
            status: 'upcoming'
        };
    });

    const { error } = await supabase.from('matches').insert(matchesToInsert);

    if (error) {
        console.error("Error inserting matches:", error);
    } else {
        console.log("Successfully imported all matches from Excel!");
    }
}

importSchedule();
