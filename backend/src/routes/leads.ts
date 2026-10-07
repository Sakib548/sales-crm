import { Router } from 'express';
import { syncFacebookLeads } from '../services/facebook.service.ts';
import prisma from '../lib/prisma.ts';

const router = Router();

// Endpoint you can hit from Postman or a "Sync Leads" button in Next.js
router.post('/sync-facebook', async (req, res) => {
    try {
        await syncFacebookLeads();
        res.json({ success: true, message: 'Leads synced successfully' });
    } catch (error: any) {
        console.error('Error syncing Facebook leads:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to sync leads from Facebook' });
    }
});

// POST /api/v1/leads/webhook - Receives lead from Google Form or Postman
router.post('/webhook', async (req, res) => {
    try {
        const body = req.body || {};
        const { fullName, email, phone, courseInterest, city, company, source } = body;

        console.log(' Incoming lead received from webhook:', body);

        // Check if a lead with this phone or email already exists to avoid duplicates
        let existingLead = null;
        if (phone && phone !== 'No phone' && phone !== 'No phone provided') {
            existingLead = await prisma.lead.findFirst({ where: { phone } });
        }
        if (!existingLead && email) {
            existingLead = await prisma.lead.findFirst({ where: { email } });
        }

        if (existingLead) {
            console.log(` Duplicate lead detected (ID: ${existingLead.id}). Skipping.`);
            return res.status(200).json({ success: true, message: 'Duplicate skipped', leadId: existingLead.id });
        }

        const newLead = await prisma.lead.create({
            data: {
                fullName: fullName || 'Unknown Student',
                email: email || null,
                phone: phone || 'No phone provided',
                courseInterest: courseInterest || 'CIPS Qualifications',
                city: city || null,
                company: company || null,
                source: source || 'Google Form',
                status: 'NEW',
            },
        });

        console.log(` Lead saved successfully to database with ID: ${newLead.id}`);
        res.status(201).json({ success: true, lead: newLead });
    } catch (error) {
        console.error(' Error saving lead from webhook:', error);
        res.status(500).json({ error: 'Failed to save lead to database' });
    }
});

// GET /api/v1/leads - Returns all leads from PostgreSQL
router.get('/', async (req, res) => {
    try {
        const allLeads = await prisma.lead.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(allLeads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});
export default router;