import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Badge, Button, Card, Field, Input, Select, Skeleton } from '@/components/ui'

export function SettingsScreen() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({ queryKey: ['settings'], queryFn: api.settings.get })
  const { data: paths } = useQuery({ queryKey: ['settings-paths'], queryFn: api.settings.paths })

  const [companyName, setCompanyName] = useState('')
  const [overhead, setOverhead] = useState(13088)
  const [targetRate, setTargetRate] = useState(145)
  const [workingDays, setWorkingDays] = useState(22)
  const [maxHours, setMaxHours] = useState(10)
  const [zones, setZones] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [travelProvider, setTravelProvider] = useState<'haversine' | 'google' | 'mapbox'>('haversine')

  useEffect(() => {
    if (!settings) return
    setCompanyName(settings.companyName)
    setOverhead(settings.monthlyOverhead)
    setTargetRate(settings.targetRevenuePerCrewHour)
    setWorkingDays(settings.workingDaysPerMonth)
    setMaxHours(settings.maxCrewHoursPerDay)
    setZones(settings.routeZones.join(', '))
    setTravelProvider(settings.travelProvider)
  }, [settings])

  if (isLoading || !settings) return <Skeleton className="m-4 h-64" />

  async function save() {
    try {
      await api.settings.update({
        companyName,
        monthlyOverhead: overhead,
        targetRevenuePerCrewHour: targetRate,
        workingDaysPerMonth: workingDays,
        maxCrewHoursPerDay: maxHours,
        routeZones: zones
          .split(',')
          .map((z) => z.trim())
          .filter(Boolean),
        travelProvider,
      })
      await queryClient.invalidateQueries({ queryKey: ['settings'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save settings')
    }
  }

  return (
    <div className="max-w-2xl space-y-4 p-4">
      <h1 className="text-lg font-semibold">Settings</h1>

      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">Company & economics</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company name">
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </Field>
          <Field label="Monthly overhead ($)">
            <Input type="number" value={overhead} onChange={(e) => setOverhead(Number(e.target.value))} />
          </Field>
          <Field label="Target revenue per crew hour ($)">
            <Input type="number" value={targetRate} onChange={(e) => setTargetRate(Number(e.target.value))} />
          </Field>
          <Field label="Working days per month">
            <Input type="number" value={workingDays} onChange={(e) => setWorkingDays(Number(e.target.value))} />
          </Field>
          <Field label="Max crew hours per day">
            <Input type="number" value={maxHours} onChange={(e) => setMaxHours(Number(e.target.value))} />
          </Field>
          <Field label="Route zones (comma-separated)">
            <Input value={zones} onChange={(e) => setZones(e.target.value)} placeholder="Petawawa, Pembroke" />
          </Field>
        </div>
        <div className="text-[11px] text-muted-foreground tnum">
          Daily break-even at these numbers: ${(overhead / Math.max(1, workingDays)).toFixed(0)}/day
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">API keys</h2>
        <p className="text-xs text-muted-foreground">
          Keys are encrypted with your operating system's secure storage and never written to plain text.
          The AI planner (Phase 3) requires the Anthropic key; everything else works offline.
        </p>
        <div className="flex items-end gap-2">
          <Field label={`Anthropic API key ${settings.hasAnthropicKey ? '(saved)' : ''}`} className="flex-1">
            <Input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder={settings.hasAnthropicKey ? '••••••••  (enter a new key to replace)' : 'sk-ant-…'}
            />
          </Field>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await api.settings.setApiKey('anthropic', anthropicKey)
                setAnthropicKey('')
                await queryClient.invalidateQueries({ queryKey: ['settings'] })
                toast.success(anthropicKey ? 'Anthropic key saved' : 'Anthropic key cleared')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Could not store the key')
              }
            }}
          >
            {anthropicKey ? 'Save key' : settings.hasAnthropicKey ? 'Clear key' : 'Save key'}
          </Button>
        </div>
        <Field label="Travel time provider">
          <Select value={travelProvider} onChange={(e) => setTravelProvider(e.target.value as typeof travelProvider)}>
            <option value="haversine">Built-in estimate (offline, no key needed)</option>
            <option value="google">Google Distance Matrix (key required)</option>
            <option value="mapbox">Mapbox (key required)</option>
          </Select>
        </Field>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">Database & backups</h2>
        <div className="space-y-1 text-xs">
          <div>
            <span className="text-muted-foreground">Database file: </span>
            <span className="break-all font-mono text-[11px]">{paths?.dbFile}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Backups folder: </span>
            <span className="break-all font-mono text-[11px]">{paths?.backupDir}</span>
          </div>
          <div className="pt-1">
            <Badge variant="green">Automatic nightly backup · 30-day retention</Badge>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const file = await api.settings.backupNow()
              toast.success(`Backup written: ${file}`)
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Backup failed')
            }
          }}
        >
          Back up now
        </Button>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save}>Save settings</Button>
      </div>
    </div>
  )
}
