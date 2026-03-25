import { useState, useMemo, useContext, createContext, useEffect, useRef } from 'react'
import './App.css'
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  Users, 
  FileText, 
  BarChart3, 
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  LayoutDashboard,
  PieChart,
  ChevronDown,
  ChevronUp,
  ArrowDownRight,
  Globe,
  List,
  Zap,
  Target,
  Award
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ── Currency config ────────────────────────────────────────────────────────
interface CurrencyConfig {
  code: string
  label: string
  symbol: string
  locale: string
  rateFromLKR: number
}

const CURRENCIES: CurrencyConfig[] = [
  { code: 'LKR', label: 'Sri Lankan Rupee',  symbol: 'Rs',  locale: 'en-LK', rateFromLKR: 1         },
  { code: 'USD', label: 'US Dollar',         symbol: '$',   locale: 'en-US', rateFromLKR: 0.003189  },
  { code: 'EUR', label: 'Euro',              symbol: '€',   locale: 'de-DE', rateFromLKR: 0.002747  },
  { code: 'GBP', label: 'British Pound',     symbol: '£',   locale: 'en-GB', rateFromLKR: 0.002374  },
  { code: 'INR', label: 'Indian Rupee',      symbol: '₹',   locale: 'en-IN', rateFromLKR: 0.299132  },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$',  locale: 'en-AU', rateFromLKR: 0.004562  },
  { code: 'SGD', label: 'Singapore Dollar',  symbol: 'S$',  locale: 'en-SG', rateFromLKR: 0.004074  },
  { code: 'JPY', label: 'Japanese Yen',      symbol: '¥',   locale: 'ja-JP', rateFromLKR: 0.505449  },
]

const CurrencyContext = createContext<CurrencyConfig>(CURRENCIES[0])
const useCurrency = () => useContext(CurrencyContext)

// ── Parameter definitions ─────────────────────────────────────────────────
// TIME_PARAMS: these get 10% deducted before use in calculations
const TIME_PARAMS = new Set([
  'studiesNoteDownTime',
  'timeToEnterStudyTimes',
  'replaceEmployeesFindingTime',
  'rebalanceTime',
  'studyDataAnalysisTime',
  'rebalancingTimeCapacity',
  'reportDataAnalysisTime',
  'reportCreationTime',
])

interface ROIParams {
  // General Parameters
  workingDaysPerWeek: number
  numberOfLines: number
  numberOfIEOfficers: number
  workingHoursPerWeekIE: number
  avgSalaryOfficer: number
  employeesPerLine: number
  employeeWorkingHours: number
  employeeAvgSalary: number
  // Study App Parameters
  studiesNoteDownTime: number
  timeToEnterStudyTimes: number
  // Absentee Balancing Parameters
  absenteeLinePercentage: number
  replaceEmployeesFindingTime: number
  rebalanceTime: number
  // Capacity Balancing Parameters
  studyDataAnalysisTime: number
  rebalancingTimeCapacity: number
  capacityBalancingTimesPerMonth: number
  // Reports Parameters
  reportQuantity: number
  reportDataAnalysisTime: number
  reportCreationTime: number
  // Skill Matrix
  skillMatrixHoursPerMonth: number
  // Factory Efficiency
  currentFactoryEfficiency: number
  // Investment Cost
  costOfInvestmentPerMonth: number
}

// Apply 10% reduction to time parameters only
function applyTimeReduction(params: ROIParams): ROIParams {
  const adjusted = { ...params }
  for (const key of TIME_PARAMS) {
    const k = key as keyof ROIParams
    ;(adjusted as Record<string, number>)[k] = (params[k] as number) * 0.8
  }
  return adjusted
}

interface EfficiencyScenario {
  label: string
  ieMultiplier: number   // salary multiplier for IE officers
  empMultiplier: number  // salary multiplier for employees
  description: string
}

const EFFICIENCY_SCENARIOS: EfficiencyScenario[] = [
  {
    label: '100% Excellent Officers',
    ieMultiplier: 1.0,
    empMultiplier: 1.0,
    description: 'All IE officers performing at 100% — full salary base',
  },
  {
    label: '50/50 Trainee / Excellent',
    ieMultiplier: 0.75, // 50% excellent (100% sal) + 50% trainee (~50% sal) → avg 75%
    empMultiplier: 1.0,
    description: '50% excellent officers + 50% trainees (~50% salary) — blended rate',
  },
]

interface ROICalculations {
  // Study App
  studyAppTimeSavingPerLine: number
  studyAppLinesPerOfficer: number
  studyAppTimeSavingPerOfficer: number
  studyAppTotalTimeSavingPerDay: number
  studyAppTotalTimeSavingPerMonth: number
  studyAppTotalTimeSavingHoursPerMonth: number
  studyAppTotalWorkingHoursPerOfficer: number
  studyAppTotalWorkingHoursAllOfficers: number
  studyAppSavedTimePercentage: number
  studyAppTotalCostPerOfficer: number
  studyAppTotalCostAllOfficers: number
  studyAppTotalBenefit: number
  // Absentee Balancing
  absenteeAffectedLines: number
  absenteeRebalancingTimeSaving: number
  absenteeTotalTimeSavingPerLine: number
  absenteeTotalTimePerEmployee: number
  absenteeTotalTimePerLinePerDay: number
  absenteeTotalTimePerWeek: number
  absenteeTotalTimePerMonth: number
  absenteeTotalWorkingHoursPerLine: number
  absenteeSavingTimePercentage: number
  absenteeTotalLaborCostPerLine: number
  absenteeIESavingTimePerMonth: number
  absenteeIESavingPercentage: number
  absenteeIESavingCost: number
  absenteeEmployeeSavingCost: number
  absenteeTotalBenefit: number
  // Capacity Balancing
  capacityTimeSavingPerLinePerDay: number
  capacityTimeSavingAllLinesPerDay: number
  capacityTimeSavingAllLinesPerMonth: number
  capacitySavedTimePercentage: number
  capacityTotalBenefit: number
  // Reports
  reportsTimeSavingPerDay: number
  reportsTimeSavingPerMonth: number
  reportsSavedTimePercentage: number
  reportsTotalBenefit: number
  // Factory-wide metrics
  totalEmployeeWorkHoursPerMonth: number
  totalIEWorkHoursPerMonth: number
  totalIECostPerHour: number
  totalEmployeeCostPerHour: number
  totalFactoryCostPerHour: number
  // Totals
  totalBenefitHoursPerMonth: number
  totalBenefits: number
  totalBenefitCost: number
  efficiencyGain: number
  totalFactoryHours: number
  roi: number
  paybackPeriod: number
}

function calculateROI(params: ROIParams, ieMultiplier = 1.0): ROICalculations {
  // Apply 10% reduction to all time parameters
  const p = applyTimeReduction(params)

  const effectiveIESalary = params.avgSalaryOfficer * ieMultiplier

  // ── Study App ──────────────────────────────────────────────────────────
  const studyAppTimeSavingPerLine = (p.studiesNoteDownTime + p.timeToEnterStudyTimes)
  const studyAppLinesPerOfficer = p.numberOfLines / p.numberOfIEOfficers
  const studyAppTimeSavingPerOfficer = studyAppTimeSavingPerLine * studyAppLinesPerOfficer
  const studyAppTotalTimeSavingPerDay = studyAppTimeSavingPerOfficer * p.numberOfIEOfficers
  const studyAppTotalTimeSavingPerMonth = studyAppTotalTimeSavingPerDay * p.workingDaysPerWeek * 4
  const studyAppTotalTimeSavingHoursPerMonth = studyAppTotalTimeSavingPerMonth / 60
  const studyAppTotalWorkingHoursPerOfficer = p.workingHoursPerWeekIE * 4
  const studyAppTotalWorkingHoursAllOfficers = studyAppTotalWorkingHoursPerOfficer * p.numberOfIEOfficers
  const studyAppSavedTimePercentage = (studyAppTotalTimeSavingHoursPerMonth / studyAppTotalWorkingHoursAllOfficers) * 100
  const studyAppTotalCostPerOfficer = effectiveIESalary * 3
  const studyAppTotalCostAllOfficers = studyAppTotalCostPerOfficer * p.numberOfIEOfficers
  const studyAppTotalBenefit = (studyAppTotalTimeSavingHoursPerMonth / studyAppTotalWorkingHoursAllOfficers) * studyAppTotalCostAllOfficers

  // ── Absentee Balancing ─────────────────────────────────────────────────
  const absenteeAffectedLines = p.numberOfLines * (p.absenteeLinePercentage / 100)
  const absenteeRebalancingTimeSaving = p.rebalanceTime - 5
  const absenteeTotalTimeSavingPerLine = p.replaceEmployeesFindingTime + absenteeRebalancingTimeSaving
  const absenteeTotalTimePerEmployee = absenteeTotalTimeSavingPerLine + (p.studyDataAnalysisTime / p.employeesPerLine)
  const absenteeTotalTimePerLinePerDay = absenteeTotalTimeSavingPerLine * p.employeesPerLine
  const absenteeTotalTimePerWeek = absenteeTotalTimePerLinePerDay * p.workingDaysPerWeek * absenteeAffectedLines
  const absenteeTotalTimePerMonth = (absenteeTotalTimePerWeek * 4) / 60
  const absenteeTotalWorkingHoursPerLine = p.employeeWorkingHours * p.employeesPerLine * 4
  const absenteeSavingTimePercentage = (absenteeTotalTimePerMonth / (absenteeTotalWorkingHoursPerLine * absenteeAffectedLines)) * 100
  const absenteeTotalLaborCostPerLine = p.employeeAvgSalary * p.employeesPerLine
  const absenteeIESavingTimePerMonth = (p.studyDataAnalysisTime / 60) * p.capacityBalancingTimesPerMonth * 4
  const absenteeIESavingPercentage = (absenteeIESavingTimePerMonth / studyAppTotalWorkingHoursPerOfficer) * 100
  const absenteeIESavingCost = (absenteeIESavingTimePerMonth / studyAppTotalWorkingHoursPerOfficer) * effectiveIESalary
  const absenteeEmployeeSavingCost = (absenteeTotalTimePerMonth / (absenteeTotalWorkingHoursPerLine * absenteeAffectedLines)) * absenteeTotalLaborCostPerLine * absenteeAffectedLines
  const absenteeTotalBenefit = absenteeIESavingCost + absenteeEmployeeSavingCost

  // ── Capacity Balancing ─────────────────────────────────────────────────
  const capacityTimeSavingPerLinePerDay = p.studyDataAnalysisTime + p.rebalancingTimeCapacity
  const capacityTimeSavingAllLinesPerDay = capacityTimeSavingPerLinePerDay * p.numberOfLines
  const capacityTimeSavingAllLinesPerMonth = (capacityTimeSavingAllLinesPerDay * p.workingDaysPerWeek * 4) / 60
  const capacitySavedTimePercentage = (capacityTimeSavingAllLinesPerMonth / studyAppTotalWorkingHoursAllOfficers) * 100
  const capacityTotalBenefit = (capacityTimeSavingAllLinesPerMonth / studyAppTotalWorkingHoursAllOfficers) * studyAppTotalCostAllOfficers

  // ── Reports ────────────────────────────────────────────────────────────
  const reportsTimeSavingPerDay = (p.reportDataAnalysisTime + p.reportCreationTime) * p.reportQuantity
  const reportsTimeSavingPerMonth = (reportsTimeSavingPerDay * p.workingDaysPerWeek * 4) / 60
  const reportsSavedTimePercentage = (reportsTimeSavingPerMonth / studyAppTotalWorkingHoursPerOfficer) * 100
  const reportsTotalBenefit = (reportsTimeSavingPerMonth / studyAppTotalWorkingHoursPerOfficer) * effectiveIESalary * p.numberOfIEOfficers

  // ── Factory-wide metrics ───────────────────────────────────────────────
  const totalEmployeeWorkHoursPerMonth = p.employeesPerLine * p.numberOfLines * p.employeeWorkingHours * 4
  const totalIEWorkHoursPerMonth = p.workingHoursPerWeekIE * 4 * p.numberOfIEOfficers

  const totalIECostPerHour = ((effectiveIESalary * 2) * p.numberOfIEOfficers) / totalIEWorkHoursPerMonth
  const totalEmployeeCostPerHour = ((p.employeeAvgSalary * 2) * p.employeesPerLine * p.numberOfLines) / totalEmployeeWorkHoursPerMonth
  const totalFactoryCostPerHour = totalIECostPerHour + totalEmployeeCostPerHour

  // ── Skill Matrix ───────────────────────────────────────────────────────
  const skillMatrixBenefitHours = p.skillMatrixHoursPerMonth

  // ── Total benefit hours ────────────────────────────────────────────────
  const totalBenefitHoursPerMonth =
    studyAppTotalTimeSavingHoursPerMonth +
    absenteeTotalTimePerMonth +
    capacityTimeSavingAllLinesPerMonth +
    reportsTimeSavingPerMonth +
    skillMatrixBenefitHours

  // ── Total benefits ─────────────────────────────────────────────────────
  const totalBenefits = studyAppTotalBenefit + absenteeTotalBenefit + capacityTotalBenefit + reportsTotalBenefit

  // ── Total benefit cost ─────────────────────────────────────────────────
  const totalBenefitCost = totalBenefitHoursPerMonth * totalFactoryCostPerHour

  // ── Efficiency gain ────────────────────────────────────────────────────
  const totalFactoryHours = totalEmployeeWorkHoursPerMonth + totalIEWorkHoursPerMonth
  const efficiencyGain = params.currentFactoryEfficiency > 0
    ? ((totalBenefitHoursPerMonth / totalFactoryHours) * 100)
    : 0

  // ── ROI & payback ──────────────────────────────────────────────────────
  const roi = ((totalBenefitCost - p.costOfInvestmentPerMonth) / p.costOfInvestmentPerMonth) * 100
  const paybackPeriod = p.costOfInvestmentPerMonth / totalBenefitCost

  return {
    studyAppTimeSavingPerLine, studyAppLinesPerOfficer, studyAppTimeSavingPerOfficer,
    studyAppTotalTimeSavingPerDay, studyAppTotalTimeSavingPerMonth, studyAppTotalTimeSavingHoursPerMonth,
    studyAppTotalWorkingHoursPerOfficer, studyAppTotalWorkingHoursAllOfficers,
    studyAppSavedTimePercentage, studyAppTotalCostPerOfficer, studyAppTotalCostAllOfficers,
    studyAppTotalBenefit,
    absenteeAffectedLines, absenteeRebalancingTimeSaving, absenteeTotalTimeSavingPerLine,
    absenteeTotalTimePerEmployee, absenteeTotalTimePerLinePerDay, absenteeTotalTimePerWeek,
    absenteeTotalTimePerMonth, absenteeTotalWorkingHoursPerLine, absenteeSavingTimePercentage,
    absenteeTotalLaborCostPerLine, absenteeIESavingTimePerMonth, absenteeIESavingPercentage,
    absenteeIESavingCost, absenteeEmployeeSavingCost, absenteeTotalBenefit,
    capacityTimeSavingPerLinePerDay, capacityTimeSavingAllLinesPerDay,
    capacityTimeSavingAllLinesPerMonth, capacitySavedTimePercentage, capacityTotalBenefit,
    reportsTimeSavingPerDay, reportsTimeSavingPerMonth, reportsSavedTimePercentage, reportsTotalBenefit,
    totalEmployeeWorkHoursPerMonth, totalIEWorkHoursPerMonth,
    totalIECostPerHour, totalEmployeeCostPerHour, totalFactoryCostPerHour,
    totalBenefitHoursPerMonth, totalBenefits, totalBenefitCost,totalFactoryHours,
    efficiencyGain, roi, paybackPeriod,
  }
}

function formatCurrency(value: number, currency: CurrencyConfig): string {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(lkrToDisplay(value, currency))
}

function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function lkrToDisplay(lkr: number, currency: CurrencyConfig): number {
  return lkr * currency.rateFromLKR
}
function displayToLkr(display: number, currency: CurrencyConfig): number {
  return currency.rateFromLKR === 0 ? 0 : display / currency.rateFromLKR
}

const defaultParams: ROIParams = {
  workingDaysPerWeek: 6,
  numberOfLines: 100,
  numberOfIEOfficers: 12,
  workingHoursPerWeekIE: 48,
  avgSalaryOfficer: 120000,
  employeesPerLine: 35,
  employeeWorkingHours: 48,
  employeeAvgSalary: 35000,
  studiesNoteDownTime: 8,
  timeToEnterStudyTimes: 20,
  absenteeLinePercentage: 15,
  replaceEmployeesFindingTime: 20,
  rebalanceTime: 25,
  studyDataAnalysisTime: 20,
  rebalancingTimeCapacity: 20,
  capacityBalancingTimesPerMonth: 8,
  reportQuantity: 4,
  reportDataAnalysisTime: 25,
  reportCreationTime: 20,
  skillMatrixHoursPerMonth: 3,
  currentFactoryEfficiency: 68,
  costOfInvestmentPerMonth: 313640,
}

// ── Logo ──────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img src="/logo.png" alt="KingsLakeBlue logo" width={2000} height={600} className="h-10 w-auto rounded-lg" />
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-kingslake-50 via-white to-kingslake-100"></div>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-kingslake-300 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-kingslake-400 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-kingslake-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <Badge className="mb-4 bg-kingslake-100 text-kingslake-700 hover:bg-kingslake-200 border-kingslake-200">
          <Calculator className="w-3 h-3 mr-1" />
          ROI Analysis Tool
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          <span className="text-gradient">Boost your </span>
          <br />
          <span className="text-foreground">Production Line Efficiency <br />up to 10%</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Calculate the return on investment for KingsLakeBlue's AI-powered Line Balancing solution. See how much time and money you can save across Capacity Planning, Time Study Management, Absentee Balancing, and Automated Reporting.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {['Real-time Calculations', 'Customizable Parameters', 'Detailed Analytics'].map(t => (
            <div key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-kingslake-500" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── InputField ────────────────────────────────────────────────────────────
function InputField({
  label, value, onChange, unit = '', min = 0, step = 1, icon: Icon
}: {
  label: string; value: number; onChange: (v: number) => void
  unit?: string; min?: number; step?: number; icon?: React.ElementType
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-kingslake-500" />}
        {label}
      </Label>
      <div className="relative">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          step={step}
          className="input-kingslake pr-12"
        />
        {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

// ── ResultCard ────────────────────────────────────────────────────────────
function ResultCard({
  title, value, subtitle, icon: Icon, trend, color = 'blue'
}: {
  title: string; value: string; subtitle?: string
  icon: React.ElementType; trend?: string; color?: 'blue' | 'green' | 'purple' | 'orange' | 'teal'
}) {
  const colorClasses = {
    blue: 'from-kingslake-500 to-kingslake-400',
    green: 'from-emerald-500 to-emerald-400',
    purple: 'from-violet-500 to-violet-400',
    orange: 'from-orange-500 to-orange-400',
    teal: 'from-teal-500 to-teal-400',
  }
  const trendMeta: Record<string, { color: string; icon: string }> = {
    Poor: { color: '#dc2626', icon: '#ef4444' }, Low: { color: '#ea580c', icon: '#f97316' },
    Moderate: { color: '#ca8a04', icon: '#eab308' }, Good: { color: '#16a34a', icon: '#22c55e' },
    Strong: { color: '#059669', icon: '#10b981' }, Excellent: { color: '#4f46e5', icon: '#6366f1' },
  }
  const meta = trend ? trendMeta[trend] : null
  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-base font-bold text-foreground leading-snug">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && meta && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3" style={{ color: meta.icon }} />
                <span className="text-xs font-medium" style={{ color: meta.color }}>{trend}</span>
              </div>
            )}
          </div>
          <div className={`w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-md`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── CalcStep ──────────────────────────────────────────────────────────────
function CalcStep({ label, value, unit = '', formula, isFinal = false, indent = false, isCurrency = false }: {
  label: string; value: number; unit?: string; formula?: string
  isFinal?: boolean; indent?: boolean; isCurrency?: boolean
}) {
  const currency = useCurrency()
  const displayValue = isCurrency
    ? formatCurrency(value, currency)
    : `${formatNumber(value, value % 1 === 0 ? 0 : 2)} ${unit}`
  return (
    <div className={`flex items-start justify-between gap-2 py-2 ${isFinal ? 'border-t-2 border-dashed border-emerald-200 mt-1 pt-3' : 'border-b border-slate-100'} ${indent ? 'pl-4' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${isFinal ? 'font-semibold text-emerald-700' : 'text-slate-600'} flex items-center gap-1.5`}>
          {indent && <ArrowDownRight className="w-3 h-3 text-slate-400 shrink-0" />}
          {label}
        </div>
        {formula && <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">{formula}</div>}
      </div>
      <div className={`text-sm font-semibold shrink-0 ${isFinal ? 'text-emerald-700 text-base' : 'text-slate-800'}`}>{displayValue}</div>
    </div>
  )
}

// ── ModuleCard ────────────────────────────────────────────────────────────
function ModuleCard({ title, icon: Icon, gradientFrom, gradientTo, accentColor, benefit, children }: {
  title: string; icon: React.ElementType; gradientFrom: string; gradientTo: string
  accentColor: string; benefit: number; children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const currency = useCurrency()
  return (
    <Card className="card-hover overflow-hidden">
      <div className="cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              {title}
            </CardTitle>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 ${accentColor}`}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-emerald-50 border border-emerald-100">
            <span className="text-sm text-emerald-700 font-medium">Monthly Benefit</span>
            <span className="text-base font-bold text-emerald-700">{formatCurrency(benefit, currency)}</span>
          </div>
          {!expanded && <p className="text-xs text-slate-400 mt-2 text-center">Click to see intermediate calculations</p>}
        </CardContent>
      </div>
      {expanded && (
        <CardContent className="pt-0 pb-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-1">{children}</div>
        </CardContent>
      )}
    </Card>
  )
}

// ── ModuleDetailCards ─────────────────────────────────────────────────────
function ModuleDetailCards({ calculations: c, params }: { calculations: ROICalculations; params: ROIParams }) {
  const adjustedP = applyTimeReduction(params)
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <ModuleCard title="Study App" icon={FileText}
        gradientFrom="from-kingslake-500" gradientTo="to-kingslake-400"
        accentColor="text-kingslake-500" benefit={c.studyAppTotalBenefit}>
        <CalcStep label="Time saving per line (after 20% reduction)" value={c.studyAppTimeSavingPerLine} unit="min" formula="(S_note + S_entry) × 0.8" />
        <CalcStep label="Lines per officer" value={c.studyAppLinesPerOfficer} unit="lines" formula="N_lines ÷ N_officers" indent />
        <CalcStep label="Time saving per officer" value={c.studyAppTimeSavingPerOfficer} unit="min" formula="saving/line × lines/officer" indent />
        <CalcStep label="Total saving — all officers/day" value={c.studyAppTotalTimeSavingPerDay} unit="min/day" formula="per officer × N_officers" />
        <CalcStep label="Total saving/month" value={c.studyAppTotalTimeSavingPerMonth} unit="min" formula="per day × W_days × 4" indent />
        <CalcStep label="Total saving/month" value={c.studyAppTotalTimeSavingHoursPerMonth} unit="hrs" formula="÷ 60" indent />
        <CalcStep label="Working hrs/officer/month" value={c.studyAppTotalWorkingHoursPerOfficer} unit="hrs" formula="W_hrs_officer × 4" />
        <CalcStep label="Working hrs — all officers/month" value={c.studyAppTotalWorkingHoursAllOfficers} unit="hrs" formula="per officer × N_officers" indent />
        <CalcStep label="Saved time %" value={c.studyAppSavedTimePercentage} unit="%" formula="(saving hrs ÷ total working hrs) × 100" />
        <CalcStep label="Cost per officer (3-month basis)" value={c.studyAppTotalCostPerOfficer} formula="Sal_officer × 3" isCurrency />
        <CalcStep label="Total cost — all officers" value={c.studyAppTotalCostAllOfficers} formula="× N_officers" indent isCurrency />
        <CalcStep label="Monthly Benefit" value={c.studyAppTotalBenefit} formula="total cost × saved time %" isFinal isCurrency />
      </ModuleCard>

      <ModuleCard title="Absentee Balancing" icon={Users}
        gradientFrom="from-violet-500" gradientTo="to-violet-400"
        accentColor="text-violet-500" benefit={c.absenteeTotalBenefit}>
        <CalcStep label="Absent line percentage" value={params.absenteeLinePercentage} unit="%" formula="user input" />
        <CalcStep label="Affected lines" value={c.absenteeAffectedLines} unit="lines" formula="N_lines × (absent_% ÷ 100)" indent />
        <CalcStep label="Rebalancing time saving (after 20% reduction)" value={c.absenteeRebalancingTimeSaving} unit="min" formula="T_rebalance×0.8 − 5" />
        <CalcStep label="Total time saving per line" value={c.absenteeTotalTimeSavingPerLine} unit="min" formula="T_find×0.8 + rebalancing saving" indent />
        <CalcStep label="Total saving per line/day" value={c.absenteeTotalTimePerLinePerDay} unit="min/day" formula="saving/line × Emp_line" />
        <CalcStep label="Total saving per week" value={c.absenteeTotalTimePerWeek} unit="min/week" formula="per line/day × W_days × affected lines" indent />
        <CalcStep label="Total saving per month" value={c.absenteeTotalTimePerMonth} unit="hrs" formula="(per week × 4) ÷ 60" indent />
        <CalcStep label="Total working hrs per line" value={c.absenteeTotalWorkingHoursPerLine} unit="hrs" formula="W_hrs_emp × Emp_line × 4" />
        <CalcStep label="Employee saving time %" value={c.absenteeSavingTimePercentage} unit="%" formula="(saving hrs ÷ working hrs × affected lines) × 100" />
        <CalcStep label="Labor cost per line" value={c.absenteeTotalLaborCostPerLine} formula="Sal_emp × Emp_line" isCurrency />
        <CalcStep label="Employee saving cost" value={c.absenteeEmployeeSavingCost} formula="labor cost × saving %" indent isCurrency />
        <CalcStep label="IE saving time/month" value={c.absenteeIESavingTimePerMonth} unit="hrs" formula="(T_analysis×0.9 ÷ 60) × Cap_freq × 4" />
        <CalcStep label="IE saving %" value={c.absenteeIESavingPercentage} unit="%" formula="(IE saving hrs ÷ W_hrs_officer×4) × 100" indent />
        <CalcStep label="IE saving cost" value={c.absenteeIESavingCost} formula="Sal_officer × IE saving %" indent isCurrency />
        <CalcStep label="Monthly Benefit" value={c.absenteeTotalBenefit} formula="IE saving cost + employee saving cost" isFinal isCurrency />
      </ModuleCard>

      <ModuleCard title="Capacity Balancing" icon={BarChart3}
        gradientFrom="from-orange-500" gradientTo="to-orange-400"
        accentColor="text-orange-500" benefit={c.capacityTotalBenefit}>
        <CalcStep label="Time saving per line/day (after 20% reduction)" value={c.capacityTimeSavingPerLinePerDay} unit="min/day" formula="(T_cap_rebal + T_analysis) × 0.8" />
        <CalcStep label="Time saving — all lines/day" value={c.capacityTimeSavingAllLinesPerDay} unit="min/day" formula="per line × N_lines" indent />
        <CalcStep label="Time saving — all lines/month" value={c.capacityTimeSavingAllLinesPerMonth} unit="hrs" formula="(all lines/day × W_days × 4) ÷ 60" indent />
        <CalcStep label="Saved time %" value={c.capacitySavedTimePercentage} unit="%" formula="(saving hrs ÷ total officer hrs) × 100" />
        <CalcStep label="Monthly Benefit" value={c.capacityTotalBenefit} formula="total officer cost × saved time %" isFinal isCurrency />
      </ModuleCard>

      <ModuleCard title="Automated Reports" icon={PieChart}
        gradientFrom="from-emerald-500" gradientTo="to-emerald-400"
        accentColor="text-emerald-600" benefit={c.reportsTotalBenefit}>
        <CalcStep label="Time saving per day (after 20% reduction)" value={c.reportsTimeSavingPerDay} unit="min/day" formula="(T_rep_analysis + T_rep_create)×0.8 × R_qty" />
        <CalcStep label="Time saving per month" value={c.reportsTimeSavingPerMonth} unit="hrs" formula="(per day × W_days × 4) ÷ 60" indent />
        <CalcStep label="Saved time %" value={c.reportsSavedTimePercentage} unit="%" formula="(saving hrs ÷ W_hrs_officer×4) × 100" />
        <CalcStep label="Monthly Benefit" value={c.reportsTotalBenefit} formula="Sal_officer × saved % × N_officers" isFinal isCurrency />
      </ModuleCard>

      <ModuleCard title="Skill Matrix" icon={Award}
        gradientFrom="from-teal-500" gradientTo="to-teal-400"
        accentColor="text-teal-500" benefit={c.totalFactoryCostPerHour * adjustedP.skillMatrixHoursPerMonth}>
        <CalcStep label="Skill matrix benefit hours/month" value={adjustedP.skillMatrixHoursPerMonth} unit="hrs" formula="user input (added directly to total benefit hours)" />
        <CalcStep label="Factory cost per hour" value={c.totalFactoryCostPerHour} formula="IE cost/hr + Emp cost/hr" isCurrency />
        <CalcStep label="Skill Matrix Monthly Benefit" value={c.totalFactoryCostPerHour * adjustedP.skillMatrixHoursPerMonth} formula="skill hours × factory cost/hr" isFinal isCurrency />
      </ModuleCard>
    </div>
  )
}

// ── Factory Efficiency Panel ──────────────────────────────────────────────
function EfficiencyPanel({
  c100, c50, params
}: {
  c100: ROICalculations
  c50: ROICalculations
  params: ROIParams
}) {
  const currency = useCurrency()

  const rows = [
    { label: 'Total Employee Work Hours/Month', v100: c100.totalEmployeeWorkHoursPerMonth, v50: c50.totalEmployeeWorkHoursPerMonth, unit: 'hrs', isCurrency: false },
    { label: 'Total IE Work Hours/Month', v100: c100.totalIEWorkHoursPerMonth, v50: c50.totalIEWorkHoursPerMonth, unit: 'hrs', isCurrency: false },
    { label: 'IE Cost per Hour (all officers)', v100: c100.totalIECostPerHour, v50: c50.totalIECostPerHour, unit: '', isCurrency: true },
    { label: 'Employee Cost per Hour (all employees)', v100: c100.totalEmployeeCostPerHour, v50: c50.totalEmployeeCostPerHour, unit: '', isCurrency: true },
    { label: 'Total Factory Cost per Hour', v100: c100.totalFactoryCostPerHour, v50: c50.totalFactoryCostPerHour, unit: '', isCurrency: true },
    { label: 'Total Benefit Hours/Month', v100: c100.totalBenefitHoursPerMonth, v50: c50.totalBenefitHoursPerMonth, unit: 'hrs', isCurrency: false },
    { label: 'Total Benefit Cost', v100: c100.totalBenefitCost, v50: c50.totalBenefitCost, unit: '', isCurrency: true },
    { label: 'Total Factory work hours/Month', v100: c100.totalFactoryHours, v50: c50.totalFactoryHours, unit: 'hrs', isCurrency: false },
    { label: 'Efficiency Gain', v100: c100.efficiencyGain, v50: c50.efficiencyGain, unit: '%', isCurrency: false },
  ]

  const fmt = (v: number, isCurrency: boolean, unit: string) =>
    isCurrency ? formatCurrency(v, currency) : `${formatNumber(v, 2)} ${unit}`

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-5 h-5 text-teal-400" />
          Factory Efficiency Analysis
          <Badge className="ml-2 bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs">
            Current Efficiency: {params.currentFactoryEfficiency}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Header row */}
        <div className="grid grid-cols-3 gap-0 bg-slate-50 border-b border-slate-200 px-4 py-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Metric</div>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide text-right flex items-center justify-end gap-1">
            <Award className="w-3 h-3" /> 100% Excellent
          </div>
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide text-right flex items-center justify-end gap-1">
            <Users className="w-3 h-3" /> 50/50 Mix
          </div>
        </div>
        {rows.map((row, i) => (
          <div key={i} className={`grid grid-cols-3 gap-0 px-4 py-3 border-b border-slate-100 ${row.label === 'Efficiency Gain' ? 'bg-emerald-50' : ''}`}>
            <div className={`text-sm ${row.label === 'Efficiency Gain' || row.label === 'Total Benefit Cost' ? 'font-semibold text-slate-700' : 'text-slate-600'}`}>
              {row.label}
              {row.label === 'Efficiency Gain' && (
                <div className="text-xs text-slate-400 font-normal mt-0.5 font-mono">
                  [(empHrs+IEhrs)/eff%] × benefitHrs × 100 / totalHrs
                </div>
              )}
            </div>
            <div className={`text-sm font-semibold text-right ${row.label === 'Efficiency Gain' ? 'text-emerald-700 text-base' : 'text-slate-800'}`}>
              {fmt(row.v100, row.isCurrency, row.unit)}
              {row.label === 'Efficiency Gain' && (
                <div className="text-xs font-normal text-emerald-600 mt-0.5">
                  +{formatNumber(row.v100, 2)}% gain
                </div>
              )}
            </div>
            <div className={`text-sm font-semibold text-right ${row.label === 'Efficiency Gain' ? 'text-amber-700 text-base' : 'text-slate-800'}`}>
              {fmt(row.v50, row.isCurrency, row.unit)}
              {row.label === 'Efficiency Gain' && (
                <div className="text-xs font-normal text-amber-600 mt-0.5">
                  +{formatNumber(row.v50, 2)}% gain
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Scenario notes */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50">
          {EFFICIENCY_SCENARIOS.map((s, i) => (
            <div key={i} className={`rounded-lg p-3 border ${i === 0 ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}>
              <p className={`text-xs font-semibold ${i === 0 ? 'text-blue-700' : 'text-amber-700'} mb-1 flex items-center gap-1`}>
                {i === 0 ? <Award className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                {s.label}
              </p>
              <p className="text-xs text-slate-500">{s.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Efficiency gain highlight cards ──────────────────────────────────────
function EfficiencyGainCards({ c100, c50, params }: { c100: ROICalculations; c50: ROICalculations; params: ROIParams }) {
  const currency = useCurrency()
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 100% scenario */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-700">100% Excellent Officers</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Benefit Cost/Month</span>
              <span className="font-bold text-slate-800">{formatCurrency(c100.totalBenefitCost, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Efficiency Gain</span>
              <span className="font-bold text-blue-700 text-base">+{formatNumber(c100.efficiencyGain, 2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">ROI</span>
              <span className="font-bold text-emerald-600">{formatNumber(c100.roi, 0)}%</span>
            </div>
          </div>
          {/* mini gauge */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Current: {params.currentFactoryEfficiency}%</span>
              <span>After: {formatNumber(Math.min(100, params.currentFactoryEfficiency + c100.efficiencyGain), 1)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700"
                style={{ width: `${Math.min(100, params.currentFactoryEfficiency + c100.efficiencyGain)}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 50/50 scenario */}
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-amber-700">50/50 Trainee / Excellent</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Benefit Cost/Month</span>
              <span className="font-bold text-slate-800">{formatCurrency(c50.totalBenefitCost, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Efficiency Gain</span>
              <span className="font-bold text-amber-700 text-base">+{formatNumber(c50.efficiencyGain, 2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">ROI</span>
              <span className="font-bold text-emerald-600">{formatNumber(c50.roi, 0)}%</span>
            </div>
          </div>
          {/* mini gauge */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Current: {params.currentFactoryEfficiency}%</span>
              <span>After: {formatNumber(Math.min(100, params.currentFactoryEfficiency + c50.efficiencyGain), 1)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-700"
                style={{ width: `${Math.min(100, params.currentFactoryEfficiency + c50.efficiencyGain)}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM MODULE SYSTEM (unchanged from original)
// ═══════════════════════════════════════════════════════════════════════════

type ParamType = 'time' | 'cost' | 'count' | 'percent'

interface CustomParam {
  id: string; name: string; variable: string; type: ParamType; value: number; unit: string
}

interface CustomStep {
  id: string; label: string; formula: string; unit: string; isCurrency: boolean; isFinal: boolean
}

interface CustomModule {
  id: string; name: string; color: string; params: CustomParam[]; steps: CustomStep[]
}

const MODULE_COLORS = [
  { label: 'Teal', from: 'from-teal-500', to: 'to-teal-400' },
  { label: 'Rose', from: 'from-rose-500', to: 'to-rose-400' },
  { label: 'Indigo', from: 'from-indigo-500', to: 'to-indigo-400' },
  { label: 'Amber', from: 'from-amber-500', to: 'to-amber-400' },
  { label: 'Cyan', from: 'from-cyan-500', to: 'to-cyan-400' },
  { label: 'Pink', from: 'from-pink-500', to: 'to-pink-400' },
]

const PARAM_TYPE_META: Record<ParamType, { label: string; defaultUnit: string }> = {
  time: { label: 'Time', defaultUnit: 'min' },
  cost: { label: 'Cost (LKR)', defaultUnit: 'LKR' },
  count: { label: 'Count', defaultUnit: 'units' },
  percent: { label: 'Percentage', defaultUnit: '%' },
}

const STORAGE_KEY = 'klb_custom_modules_v1'

function loadCustomModules(): CustomModule[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : [] }
  catch { return [] }
}

function saveCustomModules(modules: CustomModule[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(modules)) } catch {}
}

function evalFormula(formula: string, vars: Record<string, number>): number | null {
  try {
    let expr = formula
    const names = Object.keys(vars).sort((a, b) => b.length - a.length)
    for (const name of names) expr = expr.replaceAll(name, String(vars[name]))
    if (!/^[\d\s+\-*/().^%]+$/.test(expr)) return null
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + expr + ')')()
    return typeof result === 'number' && isFinite(result) ? result : null
  } catch { return null }
}

function uid() { return Math.random().toString(36).slice(2, 9) }

// ── Main ROICalculator ────────────────────────────────────────────────────
function ROICalculator() {
  const [params, setParams] = useState<ROIParams>(defaultParams)
  const [activeTab, setActiveTab] = useState('general')
  const currency = useCurrency()
  const [customModules, setCustomModules] = useState<CustomModule[]>(loadCustomModules)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<CustomModule | undefined>()

  // Two scenarios: 100% excellent, 50/50 mix
  const calc100 = useMemo(() => calculateROI(params, 1.0), [params])
  const calc50  = useMemo(() => calculateROI(params, 0.75), [params])

  // Use 100% scenario as primary display
  const calculations = calc100

  const customTotal = useMemo(() => customModules.reduce((sum, m) => {
    const vars = Object.fromEntries(m.params.map(p => [p.variable, p.value]))
    const finalStep = [...m.steps].reverse().find(s => s.isFinal)
    return sum + (finalStep ? (evalFormula(finalStep.formula, vars) ?? 0) : 0)
  }, 0), [customModules])

  const grandTotal = calculations.totalBenefitCost + customTotal
  const grandROI = ((grandTotal - params.costOfInvestmentPerMonth) / params.costOfInvestmentPerMonth) * 100
  const grandPayback = params.costOfInvestmentPerMonth / grandTotal

  const saveModules = (updated: CustomModule[]) => {
    setCustomModules(updated)
    saveCustomModules(updated)
  }

  const updateParam = (key: keyof ROIParams, value: number) => setParams(prev => ({ ...prev, [key]: value }))
  const resetToDefaults = () => setParams(defaultParams)

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">ROI Calculator</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Adjust the parameters below to match your production environment. All time parameters are automatically reduced to reflect realistic system gains.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 flex flex-col max-h-[calc(100vh-6rem)]">
              <CardHeader className="pb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-kingslake-500" />
                    Parameters
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={resetToDefaults}>Reset</Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto flex-1 min-h-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="modules">Modules</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                      <Users className="w-4 h-4" /> IE Officers
                    </p>
                    <InputField label="Working Days per Week" value={params.workingDaysPerWeek} onChange={v => updateParam('workingDaysPerWeek', v)} unit="days" icon={Clock} />
                    <InputField label="Number of Production Lines" value={params.numberOfLines} onChange={v => updateParam('numberOfLines', v)} unit="lines" icon={LayoutDashboard} />
                    <InputField label="Number of IE Officers" value={params.numberOfIEOfficers} onChange={v => updateParam('numberOfIEOfficers', v)} unit="officers" icon={Users} />
                    <InputField label="IE Officer Working Hours/Week" value={params.workingHoursPerWeekIE} onChange={v => updateParam('workingHoursPerWeekIE', v)} unit="hours" icon={Clock} />
                    <InputField label="Avg. IE Officer Salary" value={lkrToDisplay(params.avgSalaryOfficer, currency)} onChange={v => updateParam('avgSalaryOfficer', displayToLkr(v, currency))} unit={`${currency.code}/mo`} icon={DollarSign} step={Math.max(1, Math.round(lkrToDisplay(1000, currency)))} />
                    <Separator />
                    <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Employees
                    </p>
                    <InputField label="Employees per Line" value={params.employeesPerLine} onChange={v => updateParam('employeesPerLine', v)} unit="employees" icon={Users} />
                    <InputField label="Employee Working Hours/Week" value={params.employeeWorkingHours} onChange={v => updateParam('employeeWorkingHours', v)} unit="hours" icon={Clock} />
                    <InputField label="Employee Avg. Salary" value={lkrToDisplay(params.employeeAvgSalary, currency)} onChange={v => updateParam('employeeAvgSalary', displayToLkr(v, currency))} unit={`${currency.code}/mo`} icon={DollarSign} step={Math.max(1, Math.round(lkrToDisplay(1000, currency)))} />
                    <Separator />
                    <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Factory Efficiency
                    </p>
                    <InputField label="Current Factory Efficiency" value={params.currentFactoryEfficiency} onChange={v => updateParam('currentFactoryEfficiency', Math.min(100, Math.max(1, v)))} unit="%" icon={TrendingUp} min={1} step={1} />
                    <Separator />
                    <InputField label="Investment Cost per Month" value={lkrToDisplay(params.costOfInvestmentPerMonth, currency)} onChange={v => updateParam('costOfInvestmentPerMonth', displayToLkr(v, currency))} unit={`${currency.code}/mo`} icon={DollarSign} step={Math.max(1, Math.round(lkrToDisplay(1000, currency)))} />
                  </TabsContent>

                  <TabsContent value="modules" className="space-y-4">
                    {/* Study App */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Study App
                      </p>
                      <InputField label="Studies Note Down Time" value={params.studiesNoteDownTime} onChange={v => updateParam('studiesNoteDownTime', v)} unit="min" />
                      <InputField label="Time to Enter Study Data" value={params.timeToEnterStudyTimes} onChange={v => updateParam('timeToEnterStudyTimes', v)} unit="min" />
                    </div>
                    <Separator className="my-4" />
                    {/* Absentee Balancing */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Absentee Balancing
                      </p>
                      <InputField label="Absent Line Percentage" value={params.absenteeLinePercentage} onChange={v => updateParam('absenteeLinePercentage', v)} unit="%" min={0} step={1} />
                      <InputField label="Find Replacement Time" value={params.replaceEmployeesFindingTime} onChange={v => updateParam('replaceEmployeesFindingTime', v)} unit="min" />
                      <InputField label="Rebalance Time" value={params.rebalanceTime} onChange={v => updateParam('rebalanceTime', v)} unit="min" />
                    </div>
                    <Separator className="my-4" />
                    {/* Capacity Balancing */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Capacity Balancing
                      </p>
                      <InputField label="Study Data Analysis Time" value={params.studyDataAnalysisTime} onChange={v => updateParam('studyDataAnalysisTime', v)} unit="min" />
                      <InputField label="Rebalancing Time" value={params.rebalancingTimeCapacity} onChange={v => updateParam('rebalancingTimeCapacity', v)} unit="min" />
                      <InputField label="Balancing Times per Month" value={params.capacityBalancingTimesPerMonth} onChange={v => updateParam('capacityBalancingTimesPerMonth', v)} unit="times" />
                    </div>
                    <Separator className="my-4" />
                    {/* Reports */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                        <PieChart className="w-4 h-4" /> Reports
                      </p>
                      <InputField label="Daily Report Quantity" value={params.reportQuantity} onChange={v => updateParam('reportQuantity', v)} unit="reports" />
                      <InputField label="Report Data Analysis Time" value={params.reportDataAnalysisTime} onChange={v => updateParam('reportDataAnalysisTime', v)} unit="min" />
                      <InputField label="Report Creation Time" value={params.reportCreationTime} onChange={v => updateParam('reportCreationTime', v)} unit="min" />
                    </div>
                    <Separator className="my-4" />
                    {/* Skill Matrix */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-teal-600 flex items-center gap-2">
                        <Award className="w-4 h-4" /> Skill Matrix
                      </p>
                      <div className="rounded-lg bg-teal-50 border border-teal-100 p-3 text-xs text-teal-700 mb-2">
                        Enter the total hours per month saved or gained through skill matrix management. This value is added directly to the total benefit hours.
                      </div>
                      <InputField label="Skill Matrix Benefit Hours/Month" value={params.skillMatrixHoursPerMonth} onChange={v => updateParam('skillMatrixHoursPerMonth', v)} unit="hrs/mo" icon={Award} min={0} step={0.5} />
                    </div>

                    {customModules.map(m => (
                      m.params.length > 0 && (
                        <div key={m.id}>
                          <Separator className="my-4" />
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                              <Calculator className="w-4 h-4" />{m.name}
                            </p>
                            {m.params.map(p => (
                              <div key={p.id} className="space-y-1">
                                <Label className="text-sm font-medium text-foreground flex items-center justify-between">
                                  <span>{p.name}</span>
                                  <button onClick={() => {
                                    const updated = { ...m, params: m.params.filter(x => x.id !== p.id) }
                                    saveModules(customModules.map(x => x.id === m.id ? updated : x))
                                  }} className="text-slate-300 hover:text-rose-500 transition-colors text-base leading-none ml-2">×</button>
                                </Label>
                                <div className="relative">
                                  <Input type="number" value={p.value}
                                    onChange={e => {
                                      const updated = { ...m, params: m.params.map(x => x.id === p.id ? { ...x, value: parseFloat(e.target.value) || 0 } : x) }
                                      saveModules(customModules.map(x => x.id === m.id ? updated : x))
                                    }}
                                    step={p.type === 'cost' ? 1000 : 1} className="input-kingslake pr-16" />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    {p.type === 'cost' ? `${currency.code}` : p.unit}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary KPI cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <ResultCard
                title="Total Monthly Benefit Cost"
                value={formatCurrency(grandTotal, currency)}
                subtitle="100% excellent scenario"
                icon={DollarSign}
                color="green"
              />
              <ResultCard
                title="ROI"
                value={`${formatNumber(grandROI, 0)}%`}
                subtitle="Return on Investment"
                icon={TrendingUp}
                trend={
                  grandROI < 0 ? 'Poor' :
                  grandROI < 25 ? 'Low' :
                  grandROI < 75 ? 'Moderate' :
                  grandROI < 150 ? 'Good' :
                  grandROI < 300 ? 'Strong' : 'Excellent'
                }
                color="blue"
              />
              <ResultCard
                title="Payback Period"
                value={`${formatNumber(grandPayback, 2)} months`}
                subtitle="Time to recover investment"
                icon={Clock}
                color="purple"
              />
              <ResultCard
                title="Monthly Investment"
                value={formatCurrency(params.costOfInvestmentPerMonth, currency)}
                subtitle="KingsLakeBlue solution cost"
                icon={Briefcase}
                color="orange"
              />
            </div>

            {/* Efficiency gain highlight cards */}
            <div>
              <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-emerald-500" />
                Efficiency Gain by Officer Scenario
              </h3>
              <EfficiencyGainCards c100={calc100} c50={calc50} params={params} />
            </div>

            {/* Module cards */}
            <ModuleDetailCards calculations={calculations} params={params} />

            {/* Custom modules */}
            <CustomModulesSection
              modules={customModules}
              onAdd={() => { setEditingModule(undefined); setBuilderOpen(true) }}
              onEdit={(m) => { setEditingModule(m); setBuilderOpen(true) }}
              onDelete={(id) => saveModules(customModules.filter(m => m.id !== id))}
              onUpdateModule={(m) => saveModules(customModules.map(x => x.id === m.id ? m : x))}
            />

            {/* Detailed efficiency table */}
            <EfficiencyPanel c100={calc100} c50={calc50} params={params} />

            {/* Benefits breakdown bar chart */}
            <Card className="bg-gradient-to-br from-kingslake-900 to-kingslake-800 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Monthly Benefits Breakdown
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Study App', value: calculations.studyAppTotalBenefit, dot: 'bg-kingslake-400' },
                    { label: 'Absentee Balancing', value: calculations.absenteeTotalBenefit, dot: 'bg-violet-400' },
                    { label: 'Capacity Balancing', value: calculations.capacityTotalBenefit, dot: 'bg-orange-400' },
                    { label: 'Automated Reports', value: calculations.reportsTotalBenefit, dot: 'bg-emerald-400' },
                    { label: 'Skill Matrix', value: calculations.totalFactoryCostPerHour * params.skillMatrixHoursPerMonth, dot: 'bg-teal-400' },
                    ...customModules.map((m, i) => {
                      const vars = Object.fromEntries(m.params.map(p => [p.variable, p.value]))
                      const finalStep = [...m.steps].reverse().find(s => s.isFinal)
                      const val = finalStep ? (evalFormula(finalStep.formula, vars) ?? 0) : 0
                      const dotColors = ['bg-teal-400', 'bg-rose-400', 'bg-indigo-400', 'bg-amber-400', 'bg-cyan-400', 'bg-pink-400']
                      return { label: m.name, value: val, dot: dotColors[i % dotColors.length] }
                    }),
                  ].map(row => {
                    const pct = grandTotal > 0 ? (row.value / grandTotal) * 100 : 0
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${row.dot}`}></div>
                            <span className="text-kingslake-100 text-sm">{row.label}</span>
                          </div>
                          <span className="font-semibold text-sm">{formatCurrency(row.value, currency)}</span>
                        </div>
                        <div className="w-full bg-kingslake-700/50 rounded-full h-2">
                          <div className={`${row.dot} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                  <Separator className="bg-kingslake-600 my-4" />
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-kingslake-200">Total Monthly Benefits</span>
                    <span className="font-bold text-2xl">{formatCurrency(grandTotal, currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {builderOpen && (
        <ModuleBuilder
          initial={editingModule}
          onSave={(m) => {
            const existing = customModules.find(x => x.id === m.id)
            saveModules(existing ? customModules.map(x => x.id === m.id ? m : x) : [...customModules, m])
            setBuilderOpen(false); setEditingModule(undefined)
          }}
          onClose={() => { setBuilderOpen(false); setEditingModule(undefined) }}
        />
      )}
    </section>
  )
}

// ── FeaturesSection ───────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    { icon: List, title: 'Line Balancing Features', description: 'Intelligent line balancing tools to optimize production flow and reduce bottlenecks. Get real-time recommendations for optimal staffing and resource allocation.', color: 'from-teal-500 to-teal-400', href: 'https://kingslakeblue.com/line-balancing/features/' },
    { icon: FileText, title: 'Study Management', description: 'Digitize time studies and eliminate manual data entry. Capture study data directly on the production floor.', color: 'from-kingslake-500 to-kingslake-400' },
    { icon: Users, title: 'Auto Absentee Balancing', description: 'Automatically rebalance lines when absenteeism occurs according to your selection. Save time and maintain productivity with intelligent recommendations.', color: 'from-violet-500 to-violet-400' },
    { icon: BarChart3, title: 'Capacity Balancing', description: 'Optimize production line capacity with intelligent analysis and automated rebalancing recommendations.', color: 'from-orange-500 to-orange-400' },
    { icon: PieChart, title: 'Automated Reports', description: 'Generate comprehensive production reports automatically. Save hours of manual analysis and compilation.', color: 'from-emerald-500 to-emerald-400' },
  ]
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-kingslake-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">KingsLakeBlue Solutions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive suite of production management tools designed to maximize efficiency and minimize waste.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const content = (
              <Card className="card-hover group h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-kingslake-400 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardContent>
              </Card>
            )
            return feature.href
              ? <a key={index} href={feature.href} target="_blank" rel="noopener noreferrer" className="block group">{content}</a>
              : <div key={index}>{content}</div>
          })}
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-12 px-4 bg-kingslake-950 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative rounded-lg p-1 filter drop-shadow-[0_0_18px_rgba(255,255,255,0.85)]">
            <img src="/logo.png" alt="KingsLakeBlue logo" width={2000} height={600} className="h-10 w-auto object-contain rounded-md" />
          </div>
          <div className="flex items-center gap-6 text-sm text-kingslake-300">
            {['About', 'Features', 'Contact', 'Privacy'].map(l => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-sm text-kingslake-400">© 2026 KingsLakeBlue. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// ── Custom module builder (unchanged) ─────────────────────────────────────
function ParamRow({ param, onChange, onRemove }: { param: CustomParam; onChange: (p: CustomParam) => void; onRemove: () => void }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
      <div className="col-span-3"><input className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-kingslake-400" placeholder="Label e.g. Inspection time" value={param.name} onChange={e => onChange({ ...param, name: e.target.value })} /></div>
      <div className="col-span-2"><input className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 font-mono focus:outline-none focus:border-kingslake-400" placeholder="Var e.g. T_insp" value={param.variable} onChange={e => onChange({ ...param, variable: e.target.value.replace(/\s/g, '_') })} /></div>
      <div className="col-span-2"><select className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-kingslake-400 bg-white" value={param.type} onChange={e => { const t = e.target.value as ParamType; onChange({ ...param, type: t, unit: PARAM_TYPE_META[t].defaultUnit }) }}>{(Object.keys(PARAM_TYPE_META) as ParamType[]).map(t => <option key={t} value={t}>{PARAM_TYPE_META[t].label}</option>)}</select></div>
      <div className="col-span-2"><input type="number" className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-kingslake-400" placeholder="Default value" value={param.value} onChange={e => onChange({ ...param, value: parseFloat(e.target.value) || 0 })} /></div>
      <div className="col-span-2"><input className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-kingslake-400" placeholder="Unit" value={param.unit} onChange={e => onChange({ ...param, unit: e.target.value })} /></div>
      <div className="col-span-1 flex justify-end"><button onClick={onRemove} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors text-lg leading-none">×</button></div>
    </div>
  )
}

function StepRow({ step, onChange, onRemove }: { step: CustomStep; onChange: (s: CustomStep) => void; onRemove: () => void }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
      <div className="col-span-3"><input className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-kingslake-400" placeholder="Step label" value={step.label} onChange={e => onChange({ ...step, label: e.target.value })} /></div>
      <div className="col-span-4"><input className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 font-mono focus:outline-none focus:border-kingslake-400" placeholder="Formula e.g. T_insp * N_lines / 60" value={step.formula} onChange={e => onChange({ ...step, formula: e.target.value })} /></div>
      <div className="col-span-1"><input className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-kingslake-400" placeholder="unit" value={step.unit} onChange={e => onChange({ ...step, unit: e.target.value })} disabled={step.isCurrency} /></div>
      <div className="col-span-2 flex flex-col gap-1">
        <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer"><input type="checkbox" checked={step.isCurrency} onChange={e => onChange({ ...step, isCurrency: e.target.checked })} />Currency</label>
        <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer"><input type="checkbox" checked={step.isFinal} onChange={e => onChange({ ...step, isFinal: e.target.checked })} />Final row</label>
      </div>
      <div className="col-span-1 flex justify-end"><button onClick={onRemove} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors text-lg leading-none">×</button></div>
    </div>
  )
}

function ModuleBuilder({ initial, onSave, onClose }: { initial?: CustomModule; onSave: (m: CustomModule) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [colorIdx, setColorIdx] = useState(0)
  const [params, setParams] = useState<CustomParam[]>(initial?.params ?? [])
  const [steps, setSteps] = useState<CustomStep[]>(initial?.steps ?? [])
  const [activeSection, setActiveSection] = useState<'params' | 'steps'>('params')
  const [error, setError] = useState('')
  const paramVars = params.map(p => p.variable).filter(Boolean)
  const addParam = () => setParams(prev => [...prev, { id: uid(), name: '', variable: '', type: 'time', value: 0, unit: 'min' }])
  const addStep = () => setSteps(prev => [...prev, { id: uid(), label: '', formula: '', unit: 'hrs', isCurrency: false, isFinal: false }])
  const handleSave = () => {
    if (!name.trim()) { setError('Module name is required.'); return }
    if (params.some(p => !p.variable || !p.name)) { setError('All parameters need a name and variable.'); return }
    if (steps.length === 0) { setError('Add at least one calculation step.'); return }
    const col = MODULE_COLORS[colorIdx]
    onSave({ id: initial?.id ?? uid(), name: name.trim(), color: `${col.from} ${col.to}`, params, steps })
  }
  const previewVars = Object.fromEntries(params.map(p => [p.variable, p.value]))
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Calculator className="w-5 h-5 text-kingslake-500" />{initial ? 'Edit Module' : 'Add Custom Module'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          <div className="flex gap-4 items-end">
            <div className="flex-1"><Label className="text-sm font-medium mb-1 block">Module Name</Label><Input placeholder="e.g. Quality Inspection" value={name} onChange={e => setName(e.target.value)} className="input-kingslake" /></div>
            <div><Label className="text-sm font-medium mb-1 block">Color</Label><div className="flex gap-1.5">{MODULE_COLORS.map((c, i) => <button key={i} onClick={() => setColorIdx(i)} className={`w-7 h-7 rounded-full bg-gradient-to-br ${c.from} ${c.to} border-2 transition-all ${colorIdx === i ? 'border-slate-700 scale-110' : 'border-transparent'}`} />)}</div></div>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            {(['params', 'steps'] as const).map(s => <button key={s} onClick={() => setActiveSection(s)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeSection === s ? 'bg-white text-kingslake-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{s === 'params' ? `Parameters (${params.length})` : `Calc Steps (${steps.length})`}</button>)}
          </div>
          {activeSection === 'params' && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-2 text-xs font-medium text-slate-400 uppercase tracking-wide"><div className="col-span-3">Label</div><div className="col-span-2">Variable</div><div className="col-span-2">Type</div><div className="col-span-2">Default</div><div className="col-span-2">Unit</div></div>
              {params.map(p => <ParamRow key={p.id} param={p} onChange={updated => setParams(prev => prev.map(x => x.id === p.id ? updated : x))} onRemove={() => setParams(prev => prev.filter(x => x.id !== p.id))} />)}
              <button onClick={addParam} className="w-full py-2 border-2 border-dashed border-kingslake-200 rounded-lg text-sm text-kingslake-500 hover:border-kingslake-400 hover:bg-kingslake-50 transition-colors">+ Add Parameter</button>
              {paramVars.length > 0 && <div className="text-xs text-slate-400 mt-1">Available variables: {paramVars.map(v => <code key={v} className="bg-slate-100 px-1 rounded mx-0.5">{v}</code>)}</div>}
            </div>
          )}
          {activeSection === 'steps' && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-2 text-xs font-medium text-slate-400 uppercase tracking-wide"><div className="col-span-3">Label</div><div className="col-span-4">Formula</div><div className="col-span-1">Unit</div><div className="col-span-2">Flags</div></div>
              {steps.map(s => (
                <div key={s.id}>
                  <StepRow step={s} onChange={updated => setSteps(prev => prev.map(x => x.id === s.id ? updated : x))} onRemove={() => setSteps(prev => prev.filter(x => x.id !== s.id))} />
                  {s.formula && <div className="text-xs ml-2 mt-0.5">{(() => { const r = evalFormula(s.formula, previewVars); return r !== null ? <span className="text-emerald-600">→ Preview: {formatNumber(r, 2)} {s.unit}</span> : <span className="text-rose-500">→ Formula error — check variable names</span> })()}</div>}
                </div>
              ))}
              <button onClick={addStep} className="w-full py-2 border-2 border-dashed border-kingslake-200 rounded-lg text-sm text-kingslake-500 hover:border-kingslake-400 hover:bg-kingslake-50 transition-colors">+ Add Step</button>
              {paramVars.length > 0 && <div className="text-xs text-slate-400 mt-1">Available variables: {paramVars.map(v => <code key={v} className="bg-slate-100 px-1 rounded mx-0.5">{v}</code>)}<span className="ml-2 text-slate-300">· ops: + − * / ( )</span></div>}
            </div>
          )}
          {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
          <button onClick={handleSave} className="btn-primary px-5 py-2 text-sm">{initial ? 'Save Changes' : 'Add Module'}</button>
        </div>
      </div>
    </div>
  )
}

function CustomModuleCard({ module, onEdit, onDelete, onUpdateModule }: {
  module: CustomModule; onEdit: () => void; onDelete: () => void; onUpdateModule: (m: CustomModule) => void
}) {
  const [gradFrom, gradTo] = module.color.split(' ')
  const [localParams, setLocalParams] = useState(module.params)
  const updateParamValue = (id: string, value: number) => {
    const updated = localParams.map(p => p.id === id ? { ...p, value } : p)
    setLocalParams(updated); onUpdateModule({ ...module, params: updated })
  }
  const removeParam = (id: string) => {
    const updated = localParams.filter(p => p.id !== id)
    setLocalParams(updated); onUpdateModule({ ...module, params: updated })
  }
  const vars = Object.fromEntries(localParams.map(p => [p.variable, p.value]))
  const stepResults = module.steps.map(s => ({ ...s, result: evalFormula(s.formula, vars) }))
  const finalStep = [...stepResults].reverse().find(s => s.isFinal)
  const benefitLKR = finalStep?.result ?? 0
  return (
    <ModuleCard title={module.name} icon={Calculator} gradientFrom={gradFrom} gradientTo={gradTo} accentColor="text-slate-500" benefit={benefitLKR}>
      <div className="mb-3 pb-3 border-b border-slate-100 space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Parameters</p>
        {localParams.map(p => (
          <div key={p.id} className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-600 flex-1 truncate">{p.name}</span>
            <div className="flex items-center gap-1 shrink-0">
              <input type="number" className="w-20 text-xs border border-slate-200 rounded px-2 py-1 text-right focus:outline-none focus:border-kingslake-400" value={p.value} onChange={e => updateParamValue(p.id, parseFloat(e.target.value) || 0)} />
              <span className="text-xs text-slate-400 w-8">{p.unit}</span>
              <button onClick={() => removeParam(p.id)} className="w-5 h-5 flex items-center justify-center rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors text-base leading-none">×</button>
            </div>
          </div>
        ))}
        {localParams.length === 0 && <p className="text-xs text-slate-400 italic">No parameters — open Edit Module to add some.</p>}
      </div>
      {stepResults.map(s => <CalcStep key={s.id} label={s.label} value={s.result ?? 0} unit={s.unit} formula={s.formula} isFinal={s.isFinal} isCurrency={s.isCurrency} />)}
      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
        <button onClick={onEdit} className="flex-1 text-xs py-1.5 rounded-lg border border-kingslake-200 text-kingslake-600 hover:bg-kingslake-50 transition-colors font-medium">Edit Module</button>
        <button onClick={onDelete} className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors font-medium">Delete Module</button>
      </div>
    </ModuleCard>
  )
}

function CustomModulesSection({ modules, onAdd, onEdit, onDelete, onUpdateModule }: {
  modules: CustomModule[]; onAdd: () => void; onEdit: (m: CustomModule) => void; onDelete: (id: string) => void; onUpdateModule: (m: CustomModule) => void
}) {
  const currency = useCurrency()
  const customTotal = modules.reduce((sum, m) => {
    const vars = Object.fromEntries(m.params.map(p => [p.variable, p.value]))
    const finalStep = [...m.steps].reverse().find(s => s.isFinal)
    return sum + (finalStep ? (evalFormula(finalStep.formula, vars) ?? 0) : 0)
  }, 0)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-kingslake-500" />
            Custom Modules
            {modules.length > 0 && <Badge className="bg-kingslake-100 text-kingslake-700 text-xs">{modules.length}</Badge>}
          </h3>
          {modules.length > 0 && <p className="text-xs text-slate-400 mt-0.5">Combined benefit: <span className="font-semibold text-emerald-600">{formatCurrency(customTotal, currency)}</span>/month</p>}
        </div>
        <button onClick={onAdd} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">+ New Module</button>
      </div>
      {modules.length === 0 ? (
        <div onClick={onAdd} className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-kingslake-300 hover:bg-kingslake-50/30 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-kingslake-100 flex items-center justify-center mx-auto mb-3 transition-colors"><Calculator className="w-6 h-6 text-slate-400 group-hover:text-kingslake-500" /></div>
          <p className="text-sm font-medium text-slate-500 group-hover:text-kingslake-600">Add your first custom module</p>
          <p className="text-xs text-slate-400 mt-1">Define parameters, write formulas, and track new ROI sources</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">{modules.map(m => <CustomModuleCard key={m.id} module={m} onEdit={() => onEdit(m)} onDelete={() => onDelete(m.id)} onUpdateModule={onUpdateModule} />)}</div>
      )}
    </div>
  )
}

// ── CurrencySelector ──────────────────────────────────────────────────────
function CurrencySelector({ value, currencies, onChange }: { value: CurrencyConfig; currencies: CurrencyConfig[]; onChange: (c: CurrencyConfig) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])
  const usdCurrency = currencies.find(c => c.code === 'USD')
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-kingslake-200 bg-white hover:bg-kingslake-50 text-sm font-medium text-kingslake-700 transition-colors">
        <Globe className="w-4 h-4 text-kingslake-500" /><span>{value.symbol}</span><span className="text-xs text-muted-foreground">{value.code}</span><ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100"><p className="text-xs text-slate-400 font-medium uppercase tracking-wide">1 USD =</p></div>
          <div className="p-1.5">
            {currencies.map(c => {
              const rateVsUsd = usdCurrency ? c.rateFromLKR / usdCurrency.rateFromLKR : null
              return (
                <button key={c.code} onClick={() => { onChange(c); setOpen(false) }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${c.code === value.code ? 'bg-kingslake-50 text-kingslake-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <span className="flex items-center gap-2"><span className="w-6 text-center font-mono text-base">{c.symbol}</span><span>{c.code}</span></span>
                  <span className="text-xs text-slate-400 font-mono">{c.code === 'USD' ? '1.000000' : rateVsUsd !== null ? rateVsUsd.toFixed(4) : '—'}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────────────────
function App() {
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>(CURRENCIES)
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCIES[1])
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesError, setRatesError] = useState(false)

  useEffect(() => {
    async function fetchRates() {
      try {
        const primaryUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/lkr.json'
        const fallbackUrl = 'https://latest.currency-api.pages.dev/v1/currencies/lkr.json'
        let data: { lkr: Record<string, number> } | null = null
        try { const res = await fetch(primaryUrl); if (res.ok) data = await res.json() } catch {}
        if (!data) { const res = await fetch(fallbackUrl); if (!res.ok) throw new Error('Both endpoints failed'); data = await res.json() }
        if (!data) throw new Error('No data returned')
        const rates = data.lkr
        const updated = CURRENCIES.map(c => { if (c.code === 'LKR') return c; const rate = rates[c.code.toLowerCase()]; return rate ? { ...c, rateFromLKR: rate } : c })
        setCurrencies(updated)
        setCurrency(prev => updated.find(c => c.code === prev.code) ?? prev)
      } catch { setRatesError(true) }
      finally { setRatesLoading(false) }
    }
    fetchRates()
  }, [])

  return (
    <CurrencyContext.Provider value={currency}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-kingslake-100">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              {ratesLoading && <span className="text-xs text-muted-foreground animate-pulse">Fetching live rates…</span>}
              {ratesError && <span className="text-xs text-amber-500" title="Using fallback rates from Mar 24, 2026">⚠ Offline rates</span>}
              {!ratesLoading && !ratesError && <span className="text-xs text-emerald-500">● Live rates</span>}
              <CurrencySelector value={currency} currencies={currencies} onChange={c => setCurrency(currencies.find(x => x.code === c.code) ?? c)} />
            </div>
          </div>
        </header>
        <main>
          <HeroSection />
          <ROICalculator />
          <FeaturesSection />
        </main>
        <Footer />
      </div>
    </CurrencyContext.Provider>
  )
}

export default App