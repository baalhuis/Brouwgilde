import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL en Anon Key zijn niet ingesteld. Maak een .env.local bestand aan.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── AUTH ──────────────────────────────────────────────────────

export async function signUp(email, password, username, breweryName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, brewery_name: breweryName }
    }
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// ── PROFILES ──────────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}


// ── USER MANAGEMENT (superuser) ───────────────────────────────

export async function deleteProfile(userId) {
  // Delete from profiles first (cascade will handle related data)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)
  if (error) throw error
}

export async function getBreweriesTable() {
  const { data, error } = await supabase
    .from('breweries')
    .select('*')
    .order('naam')
  if (error) throw error
  return data ?? []
}

export async function createBrewery(naam, beschrijving = '') {
  const { data, error } = await supabase
    .from('breweries')
    .insert({ naam, beschrijving })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBrewery(id, updates) {
  const { data, error } = await supabase
    .from('breweries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBrewery(id) {
  const { error } = await supabase
    .from('breweries')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getBreweries() {
  // Haal namen op uit zowel profiles als de breweries tabel (zodat standalone brouwerijen ook zichtbaar zijn)
  const [profilesRes, breweriesRes] = await Promise.all([
    supabase.from('profiles').select('brewery_name').not('brewery_name', 'is', null),
    supabase.from('breweries').select('naam')
  ])
  const fromProfiles = (profilesRes.data || []).map(p => p.brewery_name).filter(Boolean)
  const fromTable = (breweriesRes.data || []).map(b => b.naam).filter(Boolean)
  const unique = [...new Set([...fromTable, ...fromProfiles])].sort()
  return unique
}

// ── BEERS ─────────────────────────────────────────────────────

export async function getBeers() {
  const { data, error } = await supabase
    .from('beers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createBeer(beer) {
  const { data, error } = await supabase
    .from('beers')
    .insert(beer)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBeer(id, updates) {
  const { data, error } = await supabase
    .from('beers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBeer(id) {
  const { error } = await supabase.from('beers').delete().eq('id', id)
  if (error) throw error
}

// ── SESSIONS ──────────────────────────────────────────────────

export async function getSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_participants(user_id),
      session_beers(beer_id, identifier, beer:beers(*)),
      session_assignments(user_id, beer_id),
      tasting_forms(*, user:profiles(username))
    `)
    .order('datum', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createSession(session) {
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSession(id) {
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw error
}

export async function updateSession(id, updates) {
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── SESSION BEERS ─────────────────────────────────────────────

export async function addBeerToSession(sessionId, beerId, identifier = null) {
  const { error } = await supabase
    .from('session_beers')
    .insert({ session_id: sessionId, beer_id: beerId, identifier })
  if (error) throw error
}

export async function removeBeerFromSession(sessionId, beerId) {
  // Verwijder eerst alle proefformulieren voor dit bier in deze sessie
  const { error: formsError } = await supabase
    .from('tasting_forms')
    .delete()
    .eq('session_id', sessionId)
    .eq('beer_id', beerId)
  if (formsError) throw formsError

  // Verwijder ook de toewijzingen voor dit bier
  const { error: assignError } = await supabase
    .from('session_assignments')
    .delete()
    .eq('session_id', sessionId)
    .eq('beer_id', beerId)
  if (assignError) throw assignError

  // Verwijder het bier uit de sessie
  const { error } = await supabase
    .from('session_beers')
    .delete()
    .eq('session_id', sessionId)
    .eq('beer_id', beerId)
  if (error) throw error
}

export async function updateBeerIdentifier(sessionId, beerId, identifier) {
  const { error } = await supabase
    .from('session_beers')
    .update({ identifier })
    .eq('session_id', sessionId)
    .eq('beer_id', beerId)
  if (error) throw error
}

// ── PARTICIPANTS ───────────────────────────────────────────────

export async function joinSession(sessionId, userId) {
  const { error } = await supabase
    .from('session_participants')
    .insert({ session_id: sessionId, user_id: userId })
  if (error) throw error
}

export async function leaveSession(sessionId, userId) {
  const { error } = await supabase
    .from('session_participants')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId)
  if (error) throw error
}

// ── ASSIGNMENTS ────────────────────────────────────────────────

export async function setAssignment(sessionId, userId, beerId, assigned) {
  if (assigned) {
    const { error } = await supabase
      .from('session_assignments')
      .insert({ session_id: sessionId, user_id: userId, beer_id: beerId })
    if (error && error.code !== '23505') throw error // ignore duplicate
  } else {
    const { error } = await supabase
      .from('session_assignments')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('beer_id', beerId)
    if (error) throw error
  }
}

export async function getAssignments(sessionId) {
  const { data, error } = await supabase
    .from('session_assignments')
    .select('*')
    .eq('session_id', sessionId)
  if (error) throw error
  return data
}

// ── TASTING FORMS ──────────────────────────────────────────────

export async function getForms(sessionId) {
  const { data, error } = await supabase
    .from('tasting_forms')
    .select(`*, user:profiles(username)`)
    .eq('session_id', sessionId)
  if (error) throw error
  return data
}

export async function getMyForms(userId) {
  const { data, error } = await supabase
    .from('tasting_forms')
    .select(`*, beer:beers(id, naam, biertype, brouwerij), session:sessions(naam, type, closed, edit_locked)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getFormsForMyBeers(breweryName) {
  // Haal alle bieren op van de brouwerij (op naam, niet op owner_id)
  // zodat bieren aangemaakt door andere leden van dezelfde brouwerij ook getoond worden
  const { data: breweryBeers, error: beersErr } = await supabase
    .from('beers')
    .select('id')
    .eq('brouwerij', breweryName)
  if (beersErr) throw beersErr
  if (!breweryBeers || breweryBeers.length === 0) return []

  const beerIds = breweryBeers.map(b => b.id)
  const { data, error } = await supabase
    .from('tasting_forms')
    .select(`*, user:profiles(username), beer:beers(naam, biertype, brouwerij, categorie, owner_id), session:sessions(naam, type)`)
    .in('beer_id', beerIds)
  if (error) throw error
  return data ?? []
}

export async function deleteForm(sessionId, beerId, userId) {
  const { error } = await supabase
    .from('tasting_forms')
    .delete()
    .eq('session_id', sessionId)
    .eq('beer_id', beerId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function upsertForm(form) {
  const { data, error } = await supabase
    .from('tasting_forms')
    .upsert(form, { onConflict: 'session_id,beer_id,user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getLeaderboard(sessionId) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('session_id', sessionId)
    .order('avg_score', { ascending: false })
  if (error) throw error
  return data
}
