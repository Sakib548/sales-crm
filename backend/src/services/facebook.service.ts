import axios from 'axios';
import prisma from '../lib/prisma.js';

export async function syncFacebookLeads() {
    const formId = process.env.FB_FORM_ID;
    const token = process.env.FB_PAGE_ACCESS_TOKEN;

    // 1. Fetch all leads from Facebook
    const url = `https://graph.facebook.com/v21.0/${formId}/leads?access_token=${token}`;
    const response = await axios.get(url);
    const leads = response.data.data; // Array of leads

    console.log(`Fetched ${leads.length} leads from Facebook.`);

    // 2. Loop through each lead and save to Postgres
    for (const fbLead of leads) {
        const fields = fbLead.field_data;

        // Helper to extract value by field name
        const getField = (name: string) =>
            fields.find((f: any) => f.name === name)?.values[0] || null;

        const fullName = getField('full_name') || 'Unknown Lead';
        const email = getField('email');
        const phone = getField('phone_number') || 'N/A';
        const courseInterest = getField('which_course_are_you_interested_in?') || 'CIPS Qualifications';
        const city = getField('city');

        // 3. Upsert into PostgreSQL (prevents duplicates using facebookLeadId)
        await prisma.lead.upsert({
            where: { facebookLeadId: fbLead.id },
            update: {}, // Don't overwrite if it already exists
            create: {
                facebookLeadId: fbLead.id,
                fullName,
                email,
                phone,
                city,
                courseInterest,
                source: 'Facebook Ads',
                status: 'NEW',
            },
        });
    }

    console.log('All Facebook leads successfully synced to PostgreSQL!');
}