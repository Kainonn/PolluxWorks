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
        // Billing Customers - Abstracto para múltiples providers
        Schema::create('billing_customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();

            // Provider (Stripe, OpenPay, PayPal, etc.)
            $table->string('provider'); // stripe, openpay, paypal, etc.
            $table->string('provider_customer_id'); // cus_xxxxx, etc.

            // Datos del customer en el provider
            $table->string('email')->nullable();
            $table->string('name')->nullable();
            $table->string('phone')->nullable();

            // Metadata del provider
            $table->json('metadata')->nullable();

            // Estado
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('provider');
            $table->index('provider_customer_id');
            $table->unique(['tenant_id', 'provider'], 'unique_tenant_provider');
        });

        // Payment Methods - Tarjetas, cuentas, wallets
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('billing_customer_id')->constrained('billing_customers')->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();

            // Provider info
            $table->string('provider'); // stripe, openpay, paypal
            $table->string('provider_payment_method_id'); // pm_xxxxx, card_xxxxx

            // Tipo de método de pago
            $table->enum('type', ['card', 'bank', 'wallet', 'other'])->default('card');

            // Datos enmascarados (para mostrar en UI)
            $table->string('last4')->nullable();
            $table->string('brand')->nullable(); // visa, mastercard, amex
            $table->string('bank_name')->nullable();
            $table->string('wallet_type')->nullable(); // apple_pay, google_pay

            // Expiración (para tarjetas)
            $table->string('exp_month', 2)->nullable();
            $table->string('exp_year', 4)->nullable();
            $table->timestamp('expires_at')->nullable();

            // Titular
            $table->string('holder_name')->nullable();

            // Estado
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);

            // Metadata
            $table->json('metadata')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('provider');
            $table->index('type');
            $table->index('is_default');
        });

        // Payments - Transacciones de pago
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('billing_customer_id')->nullable()->constrained('billing_customers')->nullOnDelete();
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods')->nullOnDelete();

            // Provider info
            $table->string('provider'); // stripe, openpay, paypal
            $table->string('provider_payment_id')->nullable(); // pi_xxxxx, ch_xxxxx
            $table->string('provider_charge_id')->nullable();

            // Monto
            $table->decimal('amount', 12, 2);
            $table->decimal('amount_refunded', 12, 2)->default(0);
            $table->string('currency', 3)->default('USD');

            // Estado del pago
            $table->enum('status', [
                'pending',    // Esperando confirmación
                'processing', // En proceso
                'succeeded',  // Exitoso
                'failed',     // Fallido
                'cancelled',  // Cancelado
                'refunded',   // Reembolsado total
                'partial_refund', // Reembolso parcial
            ])->default('pending');

            // Descripción y referencia
            $table->string('description')->nullable();
            $table->string('reference')->nullable();

            // Datos del pago
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('refunded_at')->nullable();

            // Razón de fallo si aplica
            $table->string('failure_code')->nullable();
            $table->text('failure_reason')->nullable();

            // Relacionar con invoice si existe
            $table->foreignId('invoice_id')->nullable();

            // Metadata
            $table->json('metadata')->nullable();
            $table->json('provider_response')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('provider');
            $table->index('provider_payment_id');
            $table->index('status');
            $table->index('paid_at');
        });

        // Invoices - Facturas
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('billing_customer_id')->nullable()->constrained('billing_customers')->nullOnDelete();
            $table->foreignId('subscription_id')->nullable();

            // Provider info
            $table->string('provider')->nullable(); // stripe, openpay, paypal, internal
            $table->string('provider_invoice_id')->nullable(); // in_xxxxx

            // Número de factura
            $table->string('number')->unique();
            $table->string('series')->nullable(); // A, B, etc. para series fiscales

            // Montos
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('amount_due', 12, 2);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->decimal('amount_remaining', 12, 2)->default(0);
            $table->string('currency', 3)->default('USD');

            // Estado de la factura
            $table->enum('status', [
                'draft',      // Borrador
                'open',       // Abierta (pendiente de pago)
                'paid',       // Pagada
                'void',       // Anulada
                'uncollectible', // Incobrable
            ])->default('draft');

            // Fechas
            $table->date('invoice_date');
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('voided_at')->nullable();

            // Período de facturación
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();

            // Datos de facturación
            $table->string('billing_name')->nullable();
            $table->string('billing_email')->nullable();
            $table->text('billing_address')->nullable();
            $table->string('tax_id')->nullable(); // RFC, VAT, etc.

            // URLs
            $table->string('pdf_url')->nullable();
            $table->string('hosted_url')->nullable(); // URL del provider para ver factura

            // Notas
            $table->text('notes')->nullable();
            $table->text('footer')->nullable();

            // Metadata
            $table->json('metadata')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('provider');
            $table->index('provider_invoice_id');
            $table->index('status');
            $table->index('invoice_date');
            $table->index('due_date');
        });

        // Invoice Items - Líneas de factura
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();

            // Descripción
            $table->string('description');
            $table->string('sku')->nullable();

            // Cantidades y precios
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('amount', 12, 2);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);

            // Período (si es suscripción)
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();

            // Tipo de ítem
            $table->enum('type', [
                'subscription',  // Pago de suscripción
                'proration',     // Prorrateo
                'addon',         // Complemento
                'usage',         // Uso (IA, storage, etc.)
                'fee',           // Cargo adicional
                'credit',        // Crédito/descuento
                'other',
            ])->default('subscription');

            // Metadata
            $table->json('metadata')->nullable();

            $table->timestamps();
        });

        // Webhook Events - Registro de webhooks recibidos
        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();

            // Provider info
            $table->string('provider'); // stripe, openpay, paypal
            $table->string('provider_event_id')->nullable(); // evt_xxxxx
            $table->string('event_type'); // payment_intent.succeeded, invoice.paid, etc.

            // Tenant relacionado (si se puede determinar)
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();

            // Payload completo
            $table->json('payload');

            // Headers relevantes
            $table->json('headers')->nullable();

            // Estado de procesamiento
            $table->enum('status', [
                'pending',    // Pendiente de procesar
                'processing', // En proceso
                'processed',  // Procesado exitosamente
                'failed',     // Falló el procesamiento
                'ignored',    // Ignorado (evento no relevante)
            ])->default('pending');

            // Resultado del procesamiento
            $table->text('processing_error')->nullable();
            $table->json('processing_result')->nullable();
            $table->timestamp('processed_at')->nullable();

            // Reintentos
            $table->integer('retry_count')->default(0);
            $table->timestamp('next_retry_at')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('provider');
            $table->index('provider_event_id');
            $table->index('event_type');
            $table->index('status');
            $table->index('processed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('billing_customers');
    }
};
