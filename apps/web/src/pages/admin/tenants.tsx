import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MoreHorizontal, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAdminTenants, useUpdateTenant, useAddCredits } from '@/hooks/use-admin';
import type { Tenant, PlanType, TenantType } from '@activacom/shared/types';

const PLAN_LABELS: Record<PlanType, string> = { free: 'Free', basic: 'Basic', premium: 'Premium' };
const TYPE_LABELS: Record<TenantType, string> = {
  restaurant: 'Restaurante',
  event_organizer: 'Organizador',
  band: 'Grupo musical',
};

export default function AdminTenantsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditTenant, setCreditTenant] = useState<Tenant | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');

  const filters = {
    search: search || undefined,
    status: statusFilter !== 'all' ? (statusFilter as 'active' | 'inactive') : undefined,
    plan: planFilter !== 'all' ? (planFilter as PlanType) : undefined,
    type: typeFilter !== 'all' ? (typeFilter as TenantType) : undefined,
  };

  const { data: tenants, isLoading } = useAdminTenants(filters);
  const updateTenant = useUpdateTenant();
  const addCredits = useAddCredits();

  function openCreditDialog(tenant: Tenant) {
    setCreditTenant(tenant);
    setCreditAmount('');
    setCreditDescription('');
    setCreditDialogOpen(true);
  }

  function handleAddCredits() {
    if (!creditTenant) return;
    const amount = Number(creditAmount);
    if (amount <= 0) return;

    addCredits.mutate(
      {
        tenantId: creditTenant.id,
        amount,
        description: creditDescription || 'Carga manual por admin',
      },
      {
        onSuccess: () => {
          setCreditDialogOpen(false);
          setCreditTenant(null);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Gestion de Tenants</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="restaurant">Restaurante</SelectItem>
            <SelectItem value="event_organizer">Organizador</SelectItem>
            <SelectItem value="band">Grupo musical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : !tenants || tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
            <p className="text-muted-foreground">No se encontraron tenants</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tenants</CardTitle>
            <CardDescription>
              {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} encontrado{tenants.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Creditos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <Link
                        to={`/admin/tenants/${tenant.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {tenant.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {tenant.slug}
                    </TableCell>
                    <TableCell>{TYPE_LABELS[tenant.type]}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{PLAN_LABELS[tenant.plan]}</Badge>
                    </TableCell>
                    <TableCell>{tenant.credit_balance}</TableCell>
                    <TableCell>
                      <Badge
                        variant={tenant.is_active ? 'default' : 'secondary'}
                        className={tenant.is_active ? 'bg-green-600 text-white hover:bg-green-600/90' : undefined}
                      >
                        {tenant.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(tenant.created_at), 'd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/tenants/${tenant.id}`}>Ver detalle</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              updateTenant.mutate({
                                id: tenant.id,
                                input: { is_active: !tenant.is_active },
                              })
                            }
                          >
                            {tenant.is_active ? 'Desactivar' : 'Activar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {(['free', 'basic', 'premium'] as PlanType[]).map((plan) => (
                            <DropdownMenuItem
                              key={plan}
                              disabled={tenant.plan === plan}
                              onClick={() =>
                                updateTenant.mutate({ id: tenant.id, input: { plan } })
                              }
                            >
                              Plan {PLAN_LABELS[plan]}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openCreditDialog(tenant)}>
                            <Coins className="mr-2 size-4" />
                            Cargar creditos
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Credits Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar creditos a {creditTenant?.name}</DialogTitle>
            <DialogDescription>
              Balance actual: {creditTenant?.credit_balance ?? 0} creditos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="credit-amount">Monto</Label>
              <Input
                id="credit-amount"
                type="number"
                min="1"
                placeholder="100"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-description">Descripcion</Label>
              <Input
                id="credit-description"
                placeholder="Carga manual por admin"
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddCredits}
              disabled={Number(creditAmount) <= 0 || addCredits.isPending}
            >
              {addCredits.isPending ? 'Cargando...' : 'Cargar creditos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
