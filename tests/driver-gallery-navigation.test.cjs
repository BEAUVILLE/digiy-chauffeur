const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');

test('two gallery owner buttons open real Magic Link entry, never legacy PIN 404',()=>{
  assert.match(html,/const COCKPIT_URL = "https:\/\/driver\.digiylyfe\.com\/acces-proprietaire\.html"/);
  assert.match(html,/\["cockpitBtnTop", COCKPIT_URL, false\]/);
  assert.match(html,/\["cockpitBtnBottom", COCKPIT_URL, false\]/);
  assert.doesNotMatch(html,/pro-driver\.digiylyfe\.com\/pin\.html/);
});
test('Baptiste and driver cards link to public profiles, not private management',()=>{
  const publicCard='https://driver.digiylyfe.com/chauffeur.html?slug=baptiste-driver-ambassador';
  assert.ok(html.includes('const CARD_URL = "'+publicCard+'";'));
  assert.ok(html.includes('const BAPTISTE_DRIVER_URL = "'+publicCard+'";'));
  assert.ok(html.includes('const PROFILE_URL = "https://driver.digiylyfe.com/chauffeur.html";'));
  assert.doesNotMatch(html,/https:\/\/digiy-driver-part-bapt\.digiylyfe\.com\//);
  assert.doesNotMatch(html,/const PROFILE_URL = digiyLocal\("fiche-chauffeur\.html"\)/);
  assert.doesNotMatch(html,/const CARD_URL = ".*\/gestion\.html/);
});
test('public profile links retain the chosen driver slug without exposing phone',()=>{
  assert.match(html,/function profileUrlForDriver\(d\)/);
  assert.match(html,/u\.searchParams\.set\("slug", d\.slug\)/);
  assert.match(html,/\["phone","tel","wa"\]\.forEach/);
  assert.match(html,/function forceBaptisteDriverLinks\(\)/);
});
