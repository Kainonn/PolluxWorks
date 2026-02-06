<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('plans')->restrictOnDelete();

            // Subscription Status: trial | active | overdue | expired | cancelled
            $table->enum('status', [
                'trial',      // Período de prueba
                'active',     // Suscripción activa
                'overdue',    // Pago pendiente/fallido
                'expired',    // Período terminado sin renovación
                'cancelled',  // Cancelado por usuario/admin
            ])->default('trial');

            // Fechas importantes
            $table->timestamp('started_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();

            // Renovación automática
            $table->boolean('auto_renew')->default(true);

            // Cambios de plan pendientes (upgrade/downgrade)
            $table->foreignId('pending_plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->timestamp('change_effective_at')->nullable();
            $table->enum('change_type', ['immediate', 'next_period'])->nullable();

            // Razón de cancelación (si aplica)
            $table->string('cancellation_reason')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();

            // Notas internas del admin
            $table->text('admin_notes')->nullable();

            // Metadatos adicionales
            $table->json('metadata')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('trial_ends_at');
            $table->index('current_period_end');
            $table->index('change_effective_at');
            $table->unique(['tenant_id', 'deleted_at'], 'unique_active_subscription');
        });

        // Historial de cambios de suscripción (auditoría)
        Schema::create('subscription_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained('subscriptions')->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();

            // Tipo de evento
            $table->enum('event_type', [
                'created',           // Suscripción creada
                'status_changed',    // Cambio de estado
                'plan_changed',      // Cambio de plan
                'renewed',           // Renovación
                'cancelled',         // Cancelación
                'reactivated',       // Reactivación
                'trial_started',     // Inicio de trial
                'trial_ended',       // Fin de trial
                'upgrade_scheduled', // Upgrade programado
                'downgrade_scheduled', // Downgrade programado
            ]);

            // Valores anteriores y nuevos
            $table->foreignId('from_plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->foreignId('to_plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status')->nullable();

            // Quién hizo el cambio
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('performed_by_type')->default('user'); // user | system | webhook

            // Detalles adicionales
            $table->text('reason')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamp('created_at');

            // Indexes
            $table->index('event_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_history');
        Schema::dropIfExists('subscriptions');
    }
};
