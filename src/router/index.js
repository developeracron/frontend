import { createRouter, createWebHistory } from 'vue-router';
import Login from '../pages/Login.vue';
import CreateAccount from '../pages/CreateAccount.vue';
import ResetPassword from '../pages/ResetPassword.vue';
import ConfirmEmail from '../pages/ConfirmEmail.vue';
import Dashboard from '../pages/Dashboard.vue';
import Allocations from '../pages/Allocations.vue';
import AllocationDetails from '../pages/AllocationDetails.vue';
import Clients from '../pages/Clients.vue';
import ClientForm from '../pages/ClientForm.vue';
import Tenders from '../pages/Tenders.vue';
import Phases from '../pages/Phases.vue';
import Settings from '../pages/Settings.vue';
import Users from '../pages/Users.vue';
import Notifications from '../pages/Notifications.vue';
import NoteFileDownload from '../pages/NoteFileDownload.vue';
import { useStore } from '@/store';
import Calendar from '../pages/Calendar.vue';

const routes = [
    { path: '/', redirect: '/dashboard', meta: { requiresAuth: true } },
    { path: '/login', name: 'Login', component: Login },
    { path: '/invitation', name: 'CreateAccount', component: CreateAccount },
    { path: '/email/verify:pathMatch(.*)*', name: 'ConfirmEmail', component: ConfirmEmail },
    { path: '/reset-password', name: 'ResetPassword', component: ResetPassword },
    { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/allocations/:id?', name: 'Allocations', component: Allocations, meta: { requiresAuth: true } },
    { path: '/allocations/allocation-details/:id?', name: 'AllocationDetails', component: AllocationDetails, meta: { requiresAuth: true } },
    { path: '/clients', name: 'Clients', component: Clients, meta: { requiresAuth: true } },
    { path: '/clients/new_client', name: 'AddClient', component: ClientForm, meta: { requiresAuth: true } },
    { path: '/clients/:id', name: 'EditClient', component: ClientForm, meta: { requiresAuth: true } },
    { path: '/tenders/:id?', name: 'Tenders', component: Tenders, meta: { requiresAuth: true } },
    { path: '/phases', name: 'Phases', component: Phases, meta: { requiresAuth: true } },
    { path: '/settings', name: 'Settings', component: Settings, meta: { requiresAuth: true } },
    { path: '/users', name: 'Users', component: Users, meta: { requiresAuth: true } },
    { path: '/calendar', name: 'Calendar', component: Calendar, meta: { requiresAuth: true } },
    { path: '/notifications', name: 'Notifications', component: Notifications, meta: { requiresAuth: true } },
    { path: '/files/:id', name: 'FileDownload', component: NoteFileDownload, meta: { requiresAuth: true } }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

const clearOnRoutes = ["CreateAccount", "ResetPassword", "ConfirmEmail"];

router.beforeEach(async (to, from, next) => {
    const store = useStore();


    if (clearOnRoutes.includes(to.name)) {
        localStorage.clear();
    }

    if (to.meta.requiresAuth && !store.isAuthenticated) {
        next({ name: 'Login', query: { redirect: to.fullPath } });
    } else {
        if (store.isAuthenticated && store.defaults.length === 0) {
            await store.fetchDefaults()
        }
        next();
    }
});

export default router;