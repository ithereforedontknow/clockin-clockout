import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#ffffff" },
  border: { border: "4px solid #3b82f6", padding: 30, height: "100%" },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#1e293b",
  },
  name: {
    fontSize: 28,
    textAlign: "center",
    marginVertical: 20,
    color: "#0f172a",
  },
  course: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 40,
    color: "#334155",
  },
  date: { fontSize: 14, textAlign: "center", color: "#64748b" },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 10,
    color: "#94a3b8",
  },
})

interface Props {
  employeeName: string
  courseTitle: string
  completionDate: string
}

export function CertificateDocument({
  employeeName,
  courseTitle,
  completionDate,
}: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.title}>Certificate of Completion</Text>
          <Text style={styles.name}>{employeeName}</Text>
          <Text style={styles.course}>has successfully completed</Text>
          <Text style={styles.course}>{courseTitle}</Text>
          <Text style={styles.date}>Issued on {completionDate}</Text>
          <Text style={styles.footer}>
            Verified by {new Date().getFullYear()} Learning Hub
          </Text>
        </View>
      </Page>
    </Document>
  )
}
