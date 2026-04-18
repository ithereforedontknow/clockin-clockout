export async function sendEmail(to: string, subject: string, html: string) {
  // Placeholder - integrate with your email provider later
  console.log(`[Email] To: ${to}, Subject: ${subject}`)
  html.split("\n").forEach((line) => console.log(line))
  // Example: await fetch('/api/send-email', { method: 'POST', body: JSON.stringify({ to, subject, html }) });
}

// Trigger on course assignment
export async function notifyCourseAssigned(
  employeeEmail: string,
  courseTitle: string,
  dueDate: string
) {
  const html = `
    <h2>New Course Assigned</h2>
    <p>You've been assigned <strong>${courseTitle}</strong>.</p>
    <p>Due date: ${dueDate}</p>
    <p><a href="${window.location.origin}/training">View in Learning Hub</a></p>
  `
  await sendEmail(employeeEmail, `New Course: ${courseTitle}`, html)
}

// Trigger on course completion
export async function notifyCourseCompleted(
  employeeEmail: string,
  courseTitle: string
) {
  const html = `
    <h2>Congratulations! 🎉</h2>
    <p>You've completed <strong>${courseTitle}</strong>.</p>
    <p>Your certificate is available in the Learning Hub.</p>
  `
  await sendEmail(employeeEmail, `Course Completed: ${courseTitle}`, html)
}
