window.SupabaseMesa = {
    obterCliente: function () {
        return window.supabaseClient || window.supabase || null;
    }
};
