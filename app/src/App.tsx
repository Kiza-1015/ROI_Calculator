import { useState, useMemo, useContext, createContext, useEffect } from 'react'
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
  List
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
  rateFromLKR: number   // how many of this currency per 1 LKR
}

// Fallback rates (Mar 24, 2026 — X-Rates 08:00 UTC)
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

// Context
const CurrencyContext = createContext<CurrencyConfig>(CURRENCIES[0])
const useCurrency = () => useContext(CurrencyContext)

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
  
  // Investment Cost
  costOfInvestmentPerMonth: number
}

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
  
  // Totals
  totalBenefits: number
  roi: number
  paybackPeriod: number
}

const defaultParams: ROIParams = {
  // General
  workingDaysPerWeek: 6,
  numberOfLines: 40,
  numberOfIEOfficers: 5,
  workingHoursPerWeekIE: 45,
  avgSalaryOfficer: 209815,       // LKR — converted to display currency at render time
  employeesPerLine: 10,
  employeeWorkingHours: 50,
  employeeAvgSalary: 74944,      // LKR
  
  // Study App
  studiesNoteDownTime: 5,
  timeToEnterStudyTimes: 15,
  
  // Absentee Balancing
  absenteeLinePercentage: 10,
  replaceEmployeesFindingTime: 10,
  rebalanceTime: 15,

  // Capacity Balancing
  studyDataAnalysisTime: 15,
  rebalancingTimeCapacity: 15,
  capacityBalancingTimesPerMonth: 5,
  
  // Reports
  reportQuantity: 5,
  reportDataAnalysisTime: 15,
  reportCreationTime: 10,
  
  // Investment
  costOfInvestmentPerMonth: 3136406, // LKR
}

function calculateROI(params: ROIParams): ROICalculations {
  // Study App Calculations
  const studyAppTimeSavingPerLine = params.studiesNoteDownTime + params.timeToEnterStudyTimes
  const studyAppLinesPerOfficer = params.numberOfLines / params.numberOfIEOfficers
  const studyAppTimeSavingPerOfficer = studyAppTimeSavingPerLine * studyAppLinesPerOfficer
  const studyAppTotalTimeSavingPerDay = studyAppTimeSavingPerOfficer * params.numberOfIEOfficers
  const studyAppTotalTimeSavingPerMonth = studyAppTotalTimeSavingPerDay * params.workingDaysPerWeek * 4
  const studyAppTotalTimeSavingHoursPerMonth = studyAppTotalTimeSavingPerMonth / 60
  const studyAppTotalWorkingHoursPerOfficer = params.workingHoursPerWeekIE * 4
  const studyAppTotalWorkingHoursAllOfficers = studyAppTotalWorkingHoursPerOfficer * params.numberOfIEOfficers
  const studyAppSavedTimePercentage = (studyAppTotalTimeSavingHoursPerMonth / studyAppTotalWorkingHoursAllOfficers) * 100
  const studyAppTotalCostPerOfficer = params.avgSalaryOfficer * 3 // 3-month cost basis (as per Excel)
  const studyAppTotalCostAllOfficers = studyAppTotalCostPerOfficer * params.numberOfIEOfficers
  const studyAppTotalBenefit = (studyAppTotalTimeSavingHoursPerMonth / studyAppTotalWorkingHoursAllOfficers) * studyAppTotalCostAllOfficers
  
  // Absentee Balancing Calculations
  const absenteeAffectedLines = params.numberOfLines * (params.absenteeLinePercentage / 100)
  const absenteeRebalancingTimeSaving = params.rebalanceTime - 5 // Assuming 5 min with app
  const absenteeTotalTimeSavingPerLine = params.replaceEmployeesFindingTime + absenteeRebalancingTimeSaving
  const absenteeTotalTimePerEmployee = absenteeTotalTimeSavingPerLine + (params.studyDataAnalysisTime / params.employeesPerLine)
  const absenteeTotalTimePerLinePerDay = absenteeTotalTimeSavingPerLine * params.employeesPerLine
  const absenteeTotalTimePerWeek = absenteeTotalTimePerLinePerDay * params.workingDaysPerWeek * absenteeAffectedLines
  const absenteeTotalTimePerMonth = (absenteeTotalTimePerWeek * 4) / 60
  const absenteeTotalWorkingHoursPerLine = params.employeeWorkingHours * params.employeesPerLine * 4
  const absenteeSavingTimePercentage = (absenteeTotalTimePerMonth / (absenteeTotalWorkingHoursPerLine * absenteeAffectedLines)) * 100
  const absenteeTotalLaborCostPerLine = params.employeeAvgSalary * params.employeesPerLine
  const absenteeIESavingTimePerMonth = (params.studyDataAnalysisTime / 60) * params.capacityBalancingTimesPerMonth * 4
  const absenteeIESavingPercentage = (absenteeIESavingTimePerMonth / studyAppTotalWorkingHoursPerOfficer) * 100
  const absenteeIESavingCost = (absenteeIESavingTimePerMonth / studyAppTotalWorkingHoursPerOfficer) * params.avgSalaryOfficer
  const absenteeEmployeeSavingCost = (absenteeTotalTimePerMonth / (absenteeTotalWorkingHoursPerLine * absenteeAffectedLines)) * absenteeTotalLaborCostPerLine * absenteeAffectedLines
  const absenteeTotalBenefit = absenteeIESavingCost + absenteeEmployeeSavingCost
  
  // Capacity Balancing Calculations
  const capacityTimeSavingPerLinePerDay = params.studyDataAnalysisTime + params.rebalancingTimeCapacity
  const capacityTimeSavingAllLinesPerDay = capacityTimeSavingPerLinePerDay * params.numberOfLines
  const capacityTimeSavingAllLinesPerMonth = (capacityTimeSavingAllLinesPerDay * params.workingDaysPerWeek * 4) / 60
  const capacitySavedTimePercentage = (capacityTimeSavingAllLinesPerMonth / studyAppTotalWorkingHoursAllOfficers) * 100
  const capacityTotalBenefit = (capacityTimeSavingAllLinesPerMonth / studyAppTotalWorkingHoursAllOfficers) * studyAppTotalCostAllOfficers
  
  // Reports Calculations
  const reportsTimeSavingPerDay = (params.reportDataAnalysisTime + params.reportCreationTime) * params.reportQuantity
  const reportsTimeSavingPerMonth = (reportsTimeSavingPerDay * params.workingDaysPerWeek * 4) / 60
  const reportsSavedTimePercentage = (reportsTimeSavingPerMonth / studyAppTotalWorkingHoursPerOfficer) * 100
  const reportsTotalBenefit = (reportsTimeSavingPerMonth / studyAppTotalWorkingHoursPerOfficer) * params.avgSalaryOfficer * params.numberOfIEOfficers
  
  // Total Benefits and ROI
  const totalBenefits = studyAppTotalBenefit + absenteeTotalBenefit + capacityTotalBenefit + reportsTotalBenefit
  const roi = ((totalBenefits - params.costOfInvestmentPerMonth) / params.costOfInvestmentPerMonth) * 100
  const paybackPeriod = params.costOfInvestmentPerMonth / totalBenefits
  
  return {
    studyAppTimeSavingPerLine,
    studyAppLinesPerOfficer,
    studyAppTimeSavingPerOfficer,
    studyAppTotalTimeSavingPerDay,
    studyAppTotalTimeSavingPerMonth,
    studyAppTotalTimeSavingHoursPerMonth,
    studyAppTotalWorkingHoursPerOfficer,
    studyAppTotalWorkingHoursAllOfficers,
    studyAppSavedTimePercentage,
    studyAppTotalCostPerOfficer,
    studyAppTotalCostAllOfficers,
    studyAppTotalBenefit,
    absenteeAffectedLines,
    absenteeRebalancingTimeSaving,
    absenteeTotalTimeSavingPerLine,
    absenteeTotalTimePerEmployee,
    absenteeTotalTimePerLinePerDay,
    absenteeTotalTimePerWeek,
    absenteeTotalTimePerMonth,
    absenteeTotalWorkingHoursPerLine,
    absenteeSavingTimePercentage,
    absenteeTotalLaborCostPerLine,
    absenteeIESavingTimePerMonth,
    absenteeIESavingPercentage,
    absenteeIESavingCost,
    absenteeEmployeeSavingCost,
    absenteeTotalBenefit,
    capacityTimeSavingPerLinePerDay,
    capacityTimeSavingAllLinesPerDay,
    capacityTimeSavingAllLinesPerMonth,
    capacitySavedTimePercentage,
    capacityTotalBenefit,
    reportsTimeSavingPerDay,
    reportsTimeSavingPerMonth,
    reportsSavedTimePercentage,
    reportsTotalBenefit,
    totalBenefits,
    roi,
    paybackPeriod,
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

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/logo.png"
        alt="KingsLakeBlue logo"
        width={2000}
        height={600}
        className="h-10 w-auto rounded-lg"
      />
    </div>
  )
}

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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-kingslake-500" />
            <span>Real-time Calculations</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-kingslake-500" />
            <span>Customizable Parameters</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-kingslake-500" />
            <span>Detailed Analytics</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function InputField({ 
  label, 
  value, 
  onChange, 
  unit = '', 
  type = 'number',
  min = 0,
  step = 1,
  icon: Icon
}: { 
  label: string
  value: number
  onChange: (value: number) => void
  unit?: string
  type?: string
  min?: number
  step?: number
  icon?: React.ElementType
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-kingslake-500" />}
        {label}
      </Label>
      <div className="relative">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          step={step}
          className="input-kingslake pr-12"
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

function ResultCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  trend,
  color = 'blue'
}: { 
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  trend?: string
  color?: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'from-kingslake-500 to-kingslake-400',
    green: 'from-emerald-500 to-emerald-400',
    purple: 'from-violet-500 to-violet-400',
    orange: 'from-orange-500 to-orange-400',
  }
  
  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-base font-bold text-foreground leading-snug">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">{trend}</span>
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

function CalcStep({ label, value, unit = '', formula, isFinal = false, indent = false, isCurrency = false }: {
  label: string
  value: number
  unit?: string
  formula?: string
  isFinal?: boolean
  indent?: boolean
  isCurrency?: boolean
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
        {formula && (
          <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">{formula}</div>
        )}
      </div>
      <div className={`text-sm font-semibold shrink-0 ${isFinal ? 'text-emerald-700 text-base' : 'text-slate-800'}`}>
        {displayValue}
      </div>
    </div>
  )
}

function ModuleCard({ title, icon: Icon, gradientFrom, gradientTo, accentColor, benefit, children }: {
  title: string
  icon: React.ElementType
  gradientFrom: string
  gradientTo: string
  accentColor: string
  benefit: number
  children: React.ReactNode
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
          {!expanded && (
            <p className="text-xs text-slate-400 mt-2 text-center">Click to see intermediate calculations</p>
          )}
        </CardContent>
      </div>
      {expanded && (
        <CardContent className="pt-0 pb-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-1">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function ModuleDetailCards({ calculations: c, params }: { calculations: ROICalculations; params: ROIParams }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <ModuleCard title="Study App" icon={FileText}
        gradientFrom="from-kingslake-500" gradientTo="to-kingslake-400"
        accentColor="text-kingslake-500" benefit={c.studyAppTotalBenefit}>
        <CalcStep label="Time saving per line" value={c.studyAppTimeSavingPerLine} unit="min" formula="S_note + S_entry" />
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
        <CalcStep label="Absent line percentage" value={params.absenteeLinePercentage} unit="%"
          formula="user input" />
        <CalcStep label="Affected lines" value={c.absenteeAffectedLines} unit="lines"
          formula="N_lines × (absent_% ÷ 100)" indent />
        <CalcStep label="Rebalancing time saving" value={c.absenteeRebalancingTimeSaving} unit="min" formula="T_rebalance − 5 (app saves 5 min)" />
        <CalcStep label="Total time saving per line" value={c.absenteeTotalTimeSavingPerLine} unit="min" formula="T_find + rebalancing saving" indent />
        <CalcStep label="Total saving per line/day" value={c.absenteeTotalTimePerLinePerDay} unit="min/day" formula="saving/line × Emp_line" />
        <CalcStep label="Total saving per week" value={c.absenteeTotalTimePerWeek} unit="min/week" formula="per line/day × W_days × affected lines" indent />
        <CalcStep label="Total saving per month" value={c.absenteeTotalTimePerMonth} unit="hrs" formula="(per week × 4) ÷ 60" indent />
        <CalcStep label="Total working hrs per line" value={c.absenteeTotalWorkingHoursPerLine} unit="hrs" formula="W_hrs_emp × Emp_line × 4" />
        <CalcStep label="Employee saving time %" value={c.absenteeSavingTimePercentage} unit="%" formula="(saving hrs ÷ working hrs × affected lines) × 100" />
        <CalcStep label="Labor cost per line" value={c.absenteeTotalLaborCostPerLine} formula="Sal_emp × Emp_line" isCurrency />
        <CalcStep label="Employee saving cost" value={c.absenteeEmployeeSavingCost} formula="labor cost × saving %" indent isCurrency />
        <CalcStep label="IE saving time/month" value={c.absenteeIESavingTimePerMonth} unit="hrs" formula="(T_analysis ÷ 60) × Cap_freq × 4" />
        <CalcStep label="IE saving %" value={c.absenteeIESavingPercentage} unit="%" formula="(IE saving hrs ÷ W_hrs_officer×4) × 100" indent />
        <CalcStep label="IE saving cost" value={c.absenteeIESavingCost} formula="Sal_officer × IE saving %" indent isCurrency />
        <CalcStep label="Monthly Benefit" value={c.absenteeTotalBenefit} formula="IE saving cost + employee saving cost" isFinal isCurrency />
      </ModuleCard>

      <ModuleCard title="Capacity Balancing" icon={BarChart3}
        gradientFrom="from-orange-500" gradientTo="to-orange-400"
        accentColor="text-orange-500" benefit={c.capacityTotalBenefit}>
        <CalcStep label="Time saving per line/day" value={c.capacityTimeSavingPerLinePerDay} unit="min/day" formula="T_cap_rebal + T_analysis" />
        <CalcStep label="Time saving — all lines/day" value={c.capacityTimeSavingAllLinesPerDay} unit="min/day" formula="per line × N_lines" indent />
        <CalcStep label="Time saving — all lines/month" value={c.capacityTimeSavingAllLinesPerMonth} unit="hrs" formula="(all lines/day × W_days × 4) ÷ 60" indent />
        <CalcStep label="Saved time %" value={c.capacitySavedTimePercentage} unit="%" formula="(saving hrs ÷ total officer hrs) × 100" />
        <CalcStep label="Monthly Benefit" value={c.capacityTotalBenefit} formula="total officer cost × saved time %" isFinal isCurrency />
      </ModuleCard>

      <ModuleCard title="Automated Reports" icon={PieChart}
        gradientFrom="from-emerald-500" gradientTo="to-emerald-400"
        accentColor="text-emerald-600" benefit={c.reportsTotalBenefit}>
        <CalcStep label="Time saving per day" value={c.reportsTimeSavingPerDay} unit="min/day" formula="(T_rep_analysis + T_rep_create) × R_qty" />
        <CalcStep label="Time saving per month" value={c.reportsTimeSavingPerMonth} unit="hrs" formula="(per day × W_days × 4) ÷ 60" indent />
        <CalcStep label="Saved time %" value={c.reportsSavedTimePercentage} unit="%" formula="(saving hrs ÷ W_hrs_officer×4) × 100" />
        <CalcStep label="Monthly Benefit" value={c.reportsTotalBenefit} formula="Sal_officer × saved % × N_officers" isFinal isCurrency />
      </ModuleCard>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM MODULE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

type ParamType = 'time' | 'cost' | 'count' | 'percent'

interface CustomParam {
  id: string
  name: string
  variable: string
  type: ParamType
  value: number
  unit: string
}

interface CustomStep {
  id: string
  label: string
  formula: string
  unit: string
  isCurrency: boolean
  isFinal: boolean
}

interface CustomModule {
  id: string
  name: string
  color: string
  params: CustomParam[]
  steps: CustomStep[]
}

const MODULE_COLORS = [
  { label: 'Teal',   from: 'from-teal-500',   to: 'to-teal-400'   },
  { label: 'Rose',   from: 'from-rose-500',    to: 'to-rose-400'   },
  { label: 'Indigo', from: 'from-indigo-500',  to: 'to-indigo-400' },
  { label: 'Amber',  from: 'from-amber-500',   to: 'to-amber-400'  },
  { label: 'Cyan',   from: 'from-cyan-500',    to: 'to-cyan-400'   },
  { label: 'Pink',   from: 'from-pink-500',    to: 'to-pink-400'   },
]

const PARAM_TYPE_META: Record<ParamType, { label: string; defaultUnit: string }> = {
  time:    { label: 'Time',       defaultUnit: 'min'   },
  cost:    { label: 'Cost (LKR)', defaultUnit: 'LKR'   },
  count:   { label: 'Count',      defaultUnit: 'units' },
  percent: { label: 'Percentage', defaultUnit: '%'     },
}

const STORAGE_KEY = 'klb_custom_modules_v1'

function loadCustomModules(): CustomModule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCustomModules(modules: CustomModule[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(modules)) } catch {}
}

function evalFormula(formula: string, vars: Record<string, number>): number | null {
  try {
    let expr = formula
    const names = Object.keys(vars).sort((a, b) => b.length - a.length)
    for (const name of names) {
      expr = expr.replaceAll(name, String(vars[name]))
    }
    if (!/^[\d\s+\-*/().^%]+$/.test(expr)) return null
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + expr + ')')()
    return typeof result === 'number' && isFinite(result) ? result : null
  } catch { return null }
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function ROICalculator() {
  const [params, setParams] = useState<ROIParams>(defaultParams)
  const [activeTab, setActiveTab] = useState('general')
  const currency = useCurrency()
  const [customModules, setCustomModules] = useState<CustomModule[]>(loadCustomModules)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<CustomModule | undefined>()

  const calculations = useMemo(() => calculateROI(params), [params])

  const customTotal = useMemo(() => customModules.reduce((sum, m) => {
    const vars = Object.fromEntries(m.params.map(p => [p.variable, p.value]))
    const finalStep = [...m.steps].reverse().find(s => s.isFinal)
    return sum + (finalStep ? (evalFormula(finalStep.formula, vars) ?? 0) : 0)
  }, 0), [customModules])

  const grandTotal = calculations.totalBenefits + customTotal
  const grandROI = ((grandTotal - params.costOfInvestmentPerMonth) / params.costOfInvestmentPerMonth) * 100
  const grandPayback = params.costOfInvestmentPerMonth / grandTotal

  const saveModules = (updated: CustomModule[]) => {
    setCustomModules(updated)
    saveCustomModules(updated)
  }

  const handleSaveModule = (m: CustomModule) => {
    const existing = customModules.find(x => x.id === m.id)
    const updated = existing
      ? customModules.map(x => x.id === m.id ? m : x)
      : [...customModules, m]
    saveModules(updated)
    setBuilderOpen(false)
    setEditingModule(undefined)
  }

  const handleDeleteModule = (id: string) => {
    saveModules(customModules.filter(m => m.id !== id))
  }

  const updateParam = (key: keyof ROIParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  const resetToDefaults = () => setParams(defaultParams)
  
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">ROI Calculator</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Adjust the parameters below to match your production environment and see the potential savings.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-kingslake-500" />
                    Parameters
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={resetToDefaults}>Reset</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="modules">Modules</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-4">
                    {/* IE Officer params */}
                    <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      IE Officers
                    </p>
                    <InputField
                      label="Working Days per Week"
                      value={params.workingDaysPerWeek}
                      onChange={(v) => updateParam('workingDaysPerWeek', v)}
                      unit="days"
                      icon={Clock}
                    />
                    <InputField
                      label="Number of Production Lines"
                      value={params.numberOfLines}
                      onChange={(v) => updateParam('numberOfLines', v)}
                      unit="lines"
                      icon={LayoutDashboard}
                    />
                    <InputField
                      label="Number of IE Officers"
                      value={params.numberOfIEOfficers}
                      onChange={(v) => updateParam('numberOfIEOfficers', v)}
                      unit="officers"
                      icon={Users}
                    />
                    <InputField
                      label="IE Officer Working Hours/Week"
                      value={params.workingHoursPerWeekIE}
                      onChange={(v) => updateParam('workingHoursPerWeekIE', v)}
                      unit="hours"
                      icon={Clock}
                    />
                    <InputField
                      label="Avg. IE Officer Salary"
                      value={lkrToDisplay(params.avgSalaryOfficer, currency)}
                      onChange={(v) => updateParam('avgSalaryOfficer', displayToLkr(v, currency))}
                      unit={`${currency.code}/mo`}
                      icon={DollarSign}
                      step={Math.max(1, Math.round(lkrToDisplay(1000, currency)))}
                    />

                    <Separator />

                    {/* Employee params */}
                    <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Employees
                    </p>
                    <InputField
                      label="Employees per Line"
                      value={params.employeesPerLine}
                      onChange={(v) => updateParam('employeesPerLine', v)}
                      unit="employees"
                      icon={Users}
                    />
                    <InputField
                      label="Employee Working Hours/Week"
                      value={params.employeeWorkingHours}
                      onChange={(v) => updateParam('employeeWorkingHours', v)}
                      unit="hours"
                      icon={Clock}
                    />
                    <InputField
                      label="Employee Avg. Salary"
                      value={lkrToDisplay(params.employeeAvgSalary, currency)}
                      onChange={(v) => updateParam('employeeAvgSalary', displayToLkr(v, currency))}
                      unit={`${currency.code}/mo`}
                      icon={DollarSign}
                      step={Math.max(1, Math.round(lkrToDisplay(1000, currency)))}
                    />

                    <Separator />

                    <InputField
                      label="Investment Cost per Month"
                      value={lkrToDisplay(params.costOfInvestmentPerMonth, currency)}
                      onChange={(v) => updateParam('costOfInvestmentPerMonth', displayToLkr(v, currency))}
                      unit={`${currency.code}/mo`}
                      icon={DollarSign}
                      step={Math.max(1, Math.round(lkrToDisplay(1000, currency)))}
                    />
                  </TabsContent>
                  
                  <TabsContent value="modules" className="space-y-4">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Study App
                      </p>
                      <InputField
                        label="Studies Note Down Time"
                        value={params.studiesNoteDownTime}
                        onChange={(v) => updateParam('studiesNoteDownTime', v)}
                        unit="min"
                      />
                      <InputField
                        label="Time to Enter Study Data"
                        value={params.timeToEnterStudyTimes}
                        onChange={(v) => updateParam('timeToEnterStudyTimes', v)}
                        unit="min"
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Absentee Balancing
                      </p>
                      <InputField
                        label="Absent Line Percentage"
                        value={params.absenteeLinePercentage}
                        onChange={(v) => updateParam('absenteeLinePercentage', v)}
                        unit="%"
                        min={0}
                        step={1}
                      />
                      <InputField
                        label="Find Replacement Time"
                        value={params.replaceEmployeesFindingTime}
                        onChange={(v) => updateParam('replaceEmployeesFindingTime', v)}
                        unit="min"
                      />
                      <InputField
                        label="Rebalance Time"
                        value={params.rebalanceTime}
                        onChange={(v) => updateParam('rebalanceTime', v)}
                        unit="min"
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Capacity Balancing
                      </p>
                      <InputField
                        label="Study Data Analysis Time"
                        value={params.studyDataAnalysisTime}
                        onChange={(v) => updateParam('studyDataAnalysisTime', v)}
                        unit="min"
                      />
                      <InputField
                        label="Rebalancing Time"
                        value={params.rebalancingTimeCapacity}
                        onChange={(v) => updateParam('rebalancingTimeCapacity', v)}
                        unit="min"
                      />
                      <InputField
                        label="Balancing Times per Month"
                        value={params.capacityBalancingTimesPerMonth}
                        onChange={(v) => updateParam('capacityBalancingTimesPerMonth', v)}
                        unit="times"
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        Reports
                      </p>
                      <InputField
                        label="Daily Report Quantity"
                        value={params.reportQuantity}
                        onChange={(v) => updateParam('reportQuantity', v)}
                        unit="reports"
                      />
                      <InputField
                        label="Report Data Analysis Time"
                        value={params.reportDataAnalysisTime}
                        onChange={(v) => updateParam('reportDataAnalysisTime', v)}
                        unit="min"
                      />
                      <InputField
                        label="Report Creation Time"
                        value={params.reportCreationTime}
                        onChange={(v) => updateParam('reportCreationTime', v)}
                        unit="min"
                      />
                    </div>

                    {customModules.map(m => (
                      m.params.length > 0 && (
                        <div key={m.id}>
                          <Separator className="my-4" />
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                              <Calculator className="w-4 h-4" />
                              {m.name}
                            </p>
                            {m.params.map(p => (
                              <div key={p.id} className="space-y-1">
                                <Label className="text-sm font-medium text-foreground flex items-center justify-between">
                                  <span>{p.name}</span>
                                  <button
                                    onClick={() => {
                                      const updated = { ...m, params: m.params.filter(x => x.id !== p.id) }
                                      saveModules(customModules.map(x => x.id === m.id ? updated : x))
                                    }}
                                    title="Remove parameter"
                                    className="text-slate-300 hover:text-rose-500 transition-colors text-base leading-none ml-2"
                                  >×</button>
                                </Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={p.value}
                                    onChange={e => {
                                      const updated = {
                                        ...m,
                                        params: m.params.map(x => x.id === p.id
                                          ? { ...x, value: parseFloat(e.target.value) || 0 }
                                          : x
                                        )
                                      }
                                      saveModules(customModules.map(x => x.id === m.id ? updated : x))
                                    }}
                                    step={p.type === 'cost' ? 1000 : 1}
                                    className="input-kingslake pr-16"
                                  />
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
          {/* value={formatCurrency(lkr(params.costOfInvestmentPerMonth, currency), currency)} */}

          
          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <ResultCard
                title="Total Monthly Benefit"
                value={formatCurrency(grandTotal, currency)}
                subtitle="Built-in + custom modules"
                icon={DollarSign}
                color="green"
              />
              <ResultCard
                title="ROI"
                value={`${formatNumber(grandROI, 0)}%`}
                subtitle="Return on Investment"
                icon={TrendingUp}
                trend="Excellent"
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

            <ModuleDetailCards calculations={calculations} params={params} />

            <CustomModulesSection
              modules={customModules}
              onAdd={() => { setEditingModule(undefined); setBuilderOpen(true) }}
              onEdit={(m) => { setEditingModule(m); setBuilderOpen(true) }}
              onDelete={handleDeleteModule}
              onUpdateModule={(m) => saveModules(customModules.map(x => x.id === m.id ? m : x))}
            />
            
            <Card className="bg-gradient-to-br from-kingslake-900 to-kingslake-800 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Monthly Benefits Breakdown
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Study App', value: calculations.studyAppTotalBenefit, color: 'bg-kingslake-400', dot: 'bg-kingslake-400' },
                    { label: 'Absentee Balancing', value: calculations.absenteeTotalBenefit, color: 'bg-violet-400', dot: 'bg-violet-400' },
                    { label: 'Capacity Balancing', value: calculations.capacityTotalBenefit, color: 'bg-orange-400', dot: 'bg-orange-400' },
                    { label: 'Automated Reports', value: calculations.reportsTotalBenefit, color: 'bg-emerald-400', dot: 'bg-emerald-400' },
                    ...customModules.map((m, i) => {
                      const vars = Object.fromEntries(m.params.map(p => [p.variable, p.value]))
                      const finalStep = [...m.steps].reverse().find(s => s.isFinal)
                      const val = finalStep ? (evalFormula(finalStep.formula, vars) ?? 0) : 0
                      const dotColors = ['bg-teal-400', 'bg-rose-400', 'bg-indigo-400', 'bg-amber-400', 'bg-cyan-400', 'bg-pink-400']
                      return { label: m.name, value: val, color: dotColors[i % dotColors.length], dot: dotColors[i % dotColors.length] }
                    }),
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${row.dot}`}></div>
                          <span className="text-kingslake-100 text-sm">{row.label}</span>
                        </div>
                        <span className="font-semibold text-sm">{formatCurrency(row.value, currency)}</span>
                      </div>
                      <div className="w-full bg-kingslake-700/50 rounded-full h-2">
                        <div
                          className={`${row.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${grandTotal > 0 ? (row.value / grandTotal) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
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
          onSave={handleSaveModule}
          onClose={() => { setBuilderOpen(false); setEditingModule(undefined) }}
        />
      )}
    </section>
  )
}
  
function FeaturesSection() {
  const features = [
    {
      icon: List,
      title: 'Line Balancing Features',
      description: 'Intelligent line balancing tools to optimize production flow and reduce bottlenecks. Get real-time recommendations for optimal staffing and resource allocation.',
      color: 'from-teal-500 to-teal-400',
      href: 'https://kingslakeblue.com/line-balancing/features/'
    },
    {
      icon: FileText,
      title: 'Study Management',
      description: 'Digitize time studies and eliminate manual data entry. Capture study data directly on the production floor.',
      color: 'from-kingslake-500 to-kingslake-400'
    },
    {
      icon: Users,
      title: 'Auto Absentee Balancing',
      description: 'Automatically rebalance lines when absenteeism occurs according to your selection. Save time and maintain productivity with intelligent recommendations.',
      color: 'from-violet-500 to-violet-400'
    },
    {
      icon: BarChart3,
      title: 'Capacity Balancing',
      description: 'Optimize production line capacity with intelligent analysis and automated rebalancing recommendations.',
      color: 'from-orange-500 to-orange-400'
    },
    {
      icon: PieChart,
      title: 'Automated Reports',
      description: 'Generate comprehensive production reports automatically. Save hours of manual analysis and compilation.',
      color: 'from-emerald-500 to-emerald-400'
    }
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
            const cardContent = (
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
                    <ArrowRight className="w-5 h-5 text-kingslake-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardContent>
              </Card>
            )

            if (feature.href) {
              return (
                <a
                  key={index}
                  href={feature.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  {cardContent}
                </a>
              )
            }

            return (
              <div key={index}>
                {cardContent}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 px-4 bg-kingslake-950 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative rounded-lg p-1 filter drop-shadow-[0_0_18px_rgba(255,255,255,0.85)]">
              <img
                src="/logo.png"
                alt="KingsLakeBlue logo"
                width={2000}
                height={600}
                className="h-10 w-auto object-contain rounded-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-kingslake-300">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
          <p className="text-sm text-kingslake-400">© 2026 KingsLakeBlue. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

function ParamRow({
  param, onChange, onRemove,
}: {
  param: CustomParam
  onChange: (p: CustomParam) => void
  onRemove: () => void
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
      <div className="col-span-3">
        <input
          className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-kingslake-400"
          placeholder="Label e.g. Inspection time"
          value={param.name}
          onChange={e => onChange({ ...param, name: e.target.value })}
        />
      </div>
      <div className="col-span-2">
        <input
          className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 font-mono focus:outline-none focus:border-kingslake-400"
          placeholder="Var e.g. T_insp"
          value={param.variable}
          onChange={e => onChange({ ...param, variable: e.target.value.replace(/\s/g, '_') })}
        />
      </div>
      <div className="col-span-2">
        <select
          className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-kingslake-400 bg-white"
          value={param.type}
          onChange={e => {
            const t = e.target.value as ParamType
            onChange({ ...param, type: t, unit: PARAM_TYPE_META[t].defaultUnit })
          }}
        >
          {(Object.keys(PARAM_TYPE_META) as ParamType[]).map(t => (
            <option key={t} value={t}>{PARAM_TYPE_META[t].label}</option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <input
          type="number"
          className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-kingslake-400"
          placeholder="Default value"
          value={param.value}
          onChange={e => onChange({ ...param, value: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <div className="col-span-2">
        <input
          className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-kingslake-400"
          placeholder="Unit"
          value={param.unit}
          onChange={e => onChange({ ...param, unit: e.target.value })}
        />
      </div>
      <div className="col-span-1 flex justify-end">
        <button
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors text-lg leading-none"
        >×</button>
      </div>
    </div>
  )
}

function StepRow({
  step, onChange, onRemove,
}: {
  step: CustomStep
  paramVars: string[]
  onChange: (s: CustomStep) => void
  onRemove: () => void
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
      <div className="col-span-3">
        <input
          className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-kingslake-400"
          placeholder="Step label"
          value={step.label}
          onChange={e => onChange({ ...step, label: e.target.value })}
        />
      </div>
      <div className="col-span-4">
        <input
          className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 font-mono focus:outline-none focus:border-kingslake-400"
          placeholder="Formula e.g. T_insp * N_lines / 60"
          value={step.formula}
          onChange={e => onChange({ ...step, formula: e.target.value })}
        />
      </div>
      <div className="col-span-1">
        <input
          className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-kingslake-400"
          placeholder="unit"
          value={step.unit}
          onChange={e => onChange({ ...step, unit: e.target.value })}
          disabled={step.isCurrency}
        />
      </div>
      <div className="col-span-2 flex flex-col gap-1">
        <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
          <input type="checkbox" checked={step.isCurrency}
            onChange={e => onChange({ ...step, isCurrency: e.target.checked })} />
          Currency
        </label>
        <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
          <input type="checkbox" checked={step.isFinal}
            onChange={e => onChange({ ...step, isFinal: e.target.checked })} />
          Final row
        </label>
      </div>
      <div className="col-span-1 flex justify-end">
        <button
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors text-lg leading-none"
        >×</button>
      </div>
    </div>
  )
}

function ModuleBuilder({
  initial, onSave, onClose,
}: {
  initial?: CustomModule
  onSave: (m: CustomModule) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [colorIdx, setColorIdx] = useState(0)
  const [params, setParams] = useState<CustomParam[]>(initial?.params ?? [])
  const [steps, setSteps] = useState<CustomStep[]>(initial?.steps ?? [])
  const [activeSection, setActiveSection] = useState<'params' | 'steps'>('params')
  const [error, setError] = useState('')

  const paramVars = params.map(p => p.variable).filter(Boolean)

  const addParam = () => setParams(prev => [...prev, {
    id: uid(), name: '', variable: '', type: 'time', value: 0, unit: 'min'
  }])

  const addStep = () => setSteps(prev => [...prev, {
    id: uid(), label: '', formula: '', unit: 'hrs', isCurrency: false, isFinal: false
  }])

  const handleSave = () => {
    if (!name.trim()) { setError('Module name is required.'); return }
    if (params.some(p => !p.variable || !p.name)) { setError('All parameters need a name and variable.'); return }
    if (steps.length === 0) { setError('Add at least one calculation step.'); return }
    const col = MODULE_COLORS[colorIdx]
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      color: `${col.from} ${col.to}`,
      params,
      steps,
    })
  }

  const previewVars = Object.fromEntries(params.map(p => [p.variable, p.value]))

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-kingslake-500" />
            {initial ? 'Edit Module' : 'Add Custom Module'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label className="text-sm font-medium mb-1 block">Module Name</Label>
              <Input placeholder="e.g. Quality Inspection" value={name} onChange={e => setName(e.target.value)} className="input-kingslake" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Color</Label>
              <div className="flex gap-1.5">
                {MODULE_COLORS.map((c, i) => (
                  <button key={i} onClick={() => setColorIdx(i)}
                    className={`w-7 h-7 rounded-full bg-gradient-to-br ${c.from} ${c.to} border-2 transition-all ${colorIdx === i ? 'border-slate-700 scale-110' : 'border-transparent'}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            {(['params', 'steps'] as const).map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeSection === s ? 'bg-white text-kingslake-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {s === 'params' ? `Parameters (${params.length})` : `Calc Steps (${steps.length})`}
              </button>
            ))}
          </div>

          {activeSection === 'params' && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                <div className="col-span-3">Label</div>
                <div className="col-span-2">Variable</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Default</div>
                <div className="col-span-2">Unit</div>
              </div>
              {params.map(p => (
                <ParamRow key={p.id} param={p}
                  onChange={updated => setParams(prev => prev.map(x => x.id === p.id ? updated : x))}
                  onRemove={() => setParams(prev => prev.filter(x => x.id !== p.id))} />
              ))}
              <button onClick={addParam}
                className="w-full py-2 border-2 border-dashed border-kingslake-200 rounded-lg text-sm text-kingslake-500 hover:border-kingslake-400 hover:bg-kingslake-50 transition-colors">
                + Add Parameter
              </button>
              {paramVars.length > 0 && (
                <div className="text-xs text-slate-400 mt-1">
                  Available variables: {paramVars.map(v => <code key={v} className="bg-slate-100 px-1 rounded mx-0.5">{v}</code>)}
                </div>
              )}
            </div>
          )}

          {activeSection === 'steps' && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
                <div className="col-span-3">Label</div>
                <div className="col-span-4">Formula</div>
                <div className="col-span-1">Unit</div>
                <div className="col-span-2">Flags</div>
              </div>
              {steps.map(s => (
                <div key={s.id}>
                  <StepRow step={s} paramVars={paramVars}
                    onChange={updated => setSteps(prev => prev.map(x => x.id === s.id ? updated : x))}
                    onRemove={() => setSteps(prev => prev.filter(x => x.id !== s.id))} />
                  {s.formula && (
                    <div className="text-xs ml-2 mt-0.5">
                      {(() => {
                        const result = evalFormula(s.formula, previewVars)
                        return result !== null
                          ? <span className="text-emerald-600">→ Preview: {formatNumber(result, 2)} {s.unit}</span>
                          : <span className="text-rose-500">→ Formula error — check variable names</span>
                      })()}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addStep}
                className="w-full py-2 border-2 border-dashed border-kingslake-200 rounded-lg text-sm text-kingslake-500 hover:border-kingslake-400 hover:bg-kingslake-50 transition-colors">
                + Add Step
              </button>
              {paramVars.length > 0 && (
                <div className="text-xs text-slate-400 mt-1">
                  Available variables: {paramVars.map(v => <code key={v} className="bg-slate-100 px-1 rounded mx-0.5">{v}</code>)}
                  <span className="ml-2 text-slate-300">· ops: + − * / ( )</span>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
          <button onClick={handleSave} className="btn-primary px-5 py-2 text-sm">
            {initial ? 'Save Changes' : 'Add Module'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CustomModuleCard({ module, onEdit, onDelete, onUpdateModule }: {
  module: CustomModule
  onEdit: () => void
  onDelete: () => void
  onUpdateModule: (m: CustomModule) => void
}) {
  const [gradFrom, gradTo] = module.color.split(' ')
  const [localParams, setLocalParams] = useState(module.params)
  const effectiveParams = localParams

  const updateParamValue = (id: string, value: number) => {
    const updated = localParams.map(p => p.id === id ? { ...p, value } : p)
    setLocalParams(updated)
    onUpdateModule({ ...module, params: updated })
  }

  const removeParam = (id: string) => {
    const updated = localParams.filter(p => p.id !== id)
    setLocalParams(updated)
    onUpdateModule({ ...module, params: updated })
  }

  const vars = Object.fromEntries(effectiveParams.map(p => [p.variable, p.value]))
  const stepResults = module.steps.map(s => ({
    ...s,
    result: evalFormula(s.formula, vars),
  }))
  const finalStep = [...stepResults].reverse().find(s => s.isFinal)
  const benefitLKR = finalStep?.result ?? 0

  return (
    <ModuleCard
      title={module.name}
      icon={Calculator}
      gradientFrom={gradFrom}
      gradientTo={gradTo}
      accentColor="text-slate-500"
      benefit={benefitLKR}
    >
      <div className="mb-3 pb-3 border-b border-slate-100 space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Parameters</p>
        {effectiveParams.map(p => (
          <div key={p.id} className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-600 flex-1 truncate">{p.name}</span>
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                className="w-20 text-xs border border-slate-200 rounded px-2 py-1 text-right focus:outline-none focus:border-kingslake-400"
                value={p.value}
                onChange={e => updateParamValue(p.id, parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs text-slate-400 w-8">{p.unit}</span>
              <button
                onClick={() => removeParam(p.id)}
                title="Remove parameter"
                className="w-5 h-5 flex items-center justify-center rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors text-base leading-none"
              >×</button>
            </div>
          </div>
        ))}
        {effectiveParams.length === 0 && (
          <p className="text-xs text-slate-400 italic">No parameters — open Edit Module to add some.</p>
        )}
      </div>

      {stepResults.map(s => (
        <CalcStep
          key={s.id}
          label={s.label}
          value={s.result ?? 0}
          unit={s.unit}
          formula={s.formula}
          isFinal={s.isFinal}
          isCurrency={s.isCurrency}
        />
      ))}

      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
        <button onClick={onEdit}
          className="flex-1 text-xs py-1.5 rounded-lg border border-kingslake-200 text-kingslake-600 hover:bg-kingslake-50 transition-colors font-medium">
          Edit Module
        </button>
        <button onClick={onDelete}
          className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors font-medium">
          Delete Module
        </button>
      </div>
    </ModuleCard>
  )
}

function CustomModulesSection({
  modules, onAdd, onEdit, onDelete, onUpdateModule,
}: {
  modules: CustomModule[]
  onAdd: () => void
  onEdit: (m: CustomModule) => void
  onDelete: (id: string) => void
  onUpdateModule: (m: CustomModule) => void
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
            {modules.length > 0 && (
              <Badge className="bg-kingslake-100 text-kingslake-700 text-xs">{modules.length}</Badge>
            )}
          </h3>
          {modules.length > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">
              Combined benefit: <span className="font-semibold text-emerald-600">{formatCurrency(customTotal, currency)}</span>/month
            </p>
          )}
        </div>
        <button onClick={onAdd} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
          + New Module
        </button>
      </div>

      {modules.length === 0 ? (
        <div onClick={onAdd}
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-kingslake-300 hover:bg-kingslake-50/30 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-kingslake-100 flex items-center justify-center mx-auto mb-3 transition-colors">
            <Calculator className="w-6 h-6 text-slate-400 group-hover:text-kingslake-500" />
          </div>
          <p className="text-sm font-medium text-slate-500 group-hover:text-kingslake-600">Add your first custom module</p>
          <p className="text-xs text-slate-400 mt-1">Define parameters, write formulas, and track new ROI sources</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {modules.map(m => (
            <CustomModuleCard
              key={m.id}
              module={m}
              onEdit={() => onEdit(m)}
              onDelete={() => onDelete(m.id)}
              onUpdateModule={onUpdateModule}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CurrencySelector({
  value, currencies, onChange
}: {
  value: CurrencyConfig
  currencies: CurrencyConfig[]
  onChange: (c: CurrencyConfig) => void
}) {
  const [open, setOpen] = useState(false)

  // Find USD rate to calculate cross rates for display
  const usdCurrency = currencies.find(c => c.code === 'USD')

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-kingslake-200 bg-white hover:bg-kingslake-50 text-sm font-medium text-kingslake-700 transition-colors"
      >
        <Globe className="w-4 h-4 text-kingslake-500" />
        <span>{value.symbol}</span>
        <span className="text-xs text-muted-foreground">{value.code}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">1 USD =</p>
          </div>
          <div className="p-1.5">
            {currencies.map(c => {
              // Rate of this currency per 1 USD
              const rateVsUsd = usdCurrency
                ? c.rateFromLKR / usdCurrency.rateFromLKR
                : null

              return (
                <button
                  key={c.code}
                  onClick={() => { onChange(c); setOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    c.code === value.code
                      ? 'bg-kingslake-50 text-kingslake-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 text-center font-mono text-base">{c.symbol}</span>
                    <span>{c.code}</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {c.code === 'USD'
                      ? '1.000000'
                      : rateVsUsd !== null
                        ? rateVsUsd.toFixed(4)
                        : '—'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>(CURRENCIES)
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCIES[1]) // USD is index 1
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesError, setRatesError] = useState(false)

  // Fetch live rates on mount via Frankfurter (ECB-sourced, free, no key needed)
  useEffect(() => {
  async function fetchRates() {
    try {
      // Primary: jsDelivr CDN — fetches all rates with LKR as base currency
      const primaryUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/lkr.json'
      // Fallback: Cloudflare Pages
      const fallbackUrl = 'https://latest.currency-api.pages.dev/v1/currencies/lkr.json'

      let data: { lkr: Record<string, number> } | null = null

      try {
        const res = await fetch(primaryUrl)
        if (res.ok) data = await res.json()
      } catch { /* try fallback */ }

      if (!data) {
        const res = await fetch(fallbackUrl)
        if (!res.ok) throw new Error('Both endpoints failed')
        data = await res.json()
      }

      if (!data) throw new Error('No data returned')  // ← here

      const rates = data.lkr

      const updated = CURRENCIES.map(c => {
        if (c.code === 'LKR') return c
        const rate = rates[c.code.toLowerCase()]
        return rate ? { ...c, rateFromLKR: rate } : c
      })

      setCurrencies(updated)
      setCurrency(prev => updated.find(c => c.code === prev.code) ?? prev)
    } catch {
      setRatesError(true)
    } finally {
      setRatesLoading(false)
    }
  }
  fetchRates()
}, [])

  const handleCurrencyChange = (c: CurrencyConfig) => {
    // Always pick from the live-updated list
    setCurrency(currencies.find(x => x.code === c.code) ?? c)
  }

  return (
    <CurrencyContext.Provider value={currency}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-kingslake-100">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              {ratesLoading && (
                <span className="text-xs text-muted-foreground animate-pulse">Fetching live rates…</span>
              )}
              {ratesError && (
                <span className="text-xs text-amber-500" title="Using fallback rates from Mar 24, 2026">
                  ⚠ Offline rates
                </span>
              )}
              {!ratesLoading && !ratesError && (
                <span className="text-xs text-emerald-500">● Live rates</span>
              )}
              <CurrencySelector
                value={currency}
                currencies={currencies}
                onChange={handleCurrencyChange}
              />
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