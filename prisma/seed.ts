import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.opportunity.createMany({
    data: [
      {
        contactType: "EMAIL",
        status: "RESPONDED",
        recruiterName: "Jane Smith",
        recruiterEmail: "jane.smith@techrecruit.com",
        companyName: "Acme Software",
        roleTitle: "Senior Software Developer",
        contactDate: new Date("2025-06-28"),
        notes: "Replied with availability for intro call next week.",
      },
      {
        contactType: "CALL",
        status: "INTERVIEWING",
        recruiterName: "Michael Chen",
        recruiterEmail: null,
        companyName: "Northstar Labs",
        roleTitle: "Full Stack Engineer",
        contactDate: new Date("2025-06-30"),
        notes: "Phone screen scheduled for Friday at 2pm.",
      },
      {
        contactType: "EMAIL",
        status: "NEW",
        recruiterName: "Priya Patel",
        recruiterEmail: "priya@hireflow.io",
        companyName: "CloudNine Systems",
        roleTitle: "Backend Developer",
        contactDate: new Date("2025-07-01"),
        notes: "Initial outreach about remote role.",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
