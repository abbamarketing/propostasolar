import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

const colors = { green: "#16A34A", darkGreen: "#15803D", navy: "#0F172A", text: "#475569", light: "#F1F5F9", white: "#FFFFFF" };

export function PDFHeader({ companyData }: { companyData: any }) {
  return <View style={styles.header}>{companyData?.logo_url ? <Image src={companyData.logo_url} style={styles.logo} /> : <Text style={styles.brand}>{companyData?.nome_fantasia || "ENERGIZA SOLAR"}</Text>}<View style={styles.headerLine} /></View>;
}

export function PDFFooter({ pageNumber, totalPages, companyData }: { pageNumber: number; totalPages: number; companyData: any }) {
  return <View style={styles.footer}><Text>{companyData?.email || "energizasolar@gmail.com"} · {companyData?.telefone || "(38) 9895-9015"}</Text><Text>{pageNumber}/{totalPages}</Text></View>;
}

export function SectionTitle({ children }: { children: string }) { return <Text style={styles.title}>{children}</Text>; }
export function Disclaimer({ children }: { children: string }) { return <Text style={styles.disclaimer}>{children}</Text>; }
export function KpiBox({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) { return <View style={styles.kpi}><Text style={styles.kpiLabel}>{label}</Text><Text style={styles.kpiValue}>{value}</Text>{subtitle ? <Text style={styles.kpiSubtitle}>{subtitle}</Text> : null}</View>; }

export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return <View style={styles.table}><View style={styles.tableHeader}>{columns.map((column) => <Text key={column} style={styles.th}>{column}</Text>)}</View>{rows.map((row, index) => <View key={index} style={styles.tr}>{row.map((cell, cellIndex) => <Text key={`${index}-${cellIndex}`} style={styles.td}>{cell}</Text>)}</View>)}</View>;
}

export const pdfStyles = { colors };

const styles = StyleSheet.create({
  header: { marginBottom: 18 }, logo: { width: 82, height: 34, objectFit: "contain" }, brand: { fontSize: 13, fontWeight: 700, color: colors.navy }, headerLine: { marginTop: 10, height: 2, backgroundColor: colors.green },
  footer: { position: "absolute", left: 36, right: 36, bottom: 18, flexDirection: "row", justifyContent: "space-between", color: colors.text, fontSize: 8 },
  title: { fontSize: 24, fontWeight: 700, color: colors.navy, marginBottom: 16 }, disclaimer: { fontSize: 8, color: colors.text, marginTop: 8 },
  kpi: { flex: 1, backgroundColor: colors.light, borderRadius: 10, padding: 12, marginRight: 8 }, kpiLabel: { color: colors.text, fontSize: 9, marginBottom: 6 }, kpiValue: { color: colors.green, fontSize: 20, fontWeight: 700 }, kpiSubtitle: { color: colors.text, fontSize: 8, marginTop: 3 },
  table: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, overflow: "hidden" }, tableHeader: { flexDirection: "row", backgroundColor: colors.navy }, th: { flex: 1, color: colors.white, fontSize: 9, fontWeight: 700, padding: 8 }, tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#E2E8F0" }, td: { flex: 1, color: colors.text, fontSize: 9, padding: 8 },
});