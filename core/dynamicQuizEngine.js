/* Istoria V10 Phase 8 - Dynamic Quiz Engine */
(function(){
  const BANK = [
    {topic:'Εποχή του Λίθου', chapter:1, q:'Τι χαρακτηρίζει τη Νεολιθική εποχή;', a:['Μόνιμη εγκατάσταση, γεωργία και κτηνοτροφία','Μόνο κυνήγι και μετακινήσεις','Η ρωμαϊκή ειρήνη'], correct:0, difficulty:1},
    {topic:'Εποχή του Χαλκού', chapter:2, q:'Ποιο μέταλλο δίνει το όνομα στην Εποχή του Χαλκού;', a:['Ο σίδηρος','Ο χαλκός','Ο χρυσός'], correct:1, difficulty:1},
    {topic:'Πόλη-κράτος', chapter:4, q:'Τι είναι η πόλη-κράτος;', a:['Κοινότητα πολιτών με δικούς της νόμους','Μεγάλη αυτοκρατορία','Μόνο εμπορικό λιμάνι'], correct:0, difficulty:2},
    {topic:'Αθήνα', chapter:5, q:'Με τι συνδέεται η ηγεμονία της Αθήνας;', a:['Με τη Συμμαχία της Δήλου και τη ναυτική δύναμη','Με τη ρωμαϊκή λεγεώνα','Με τη Νεολιθική γεωργία'], correct:0, difficulty:2},
    {topic:'Πελοποννησιακός πόλεμος', chapter:6, q:'Ποιοι ήταν οι βασικοί αντίπαλοι στον Πελοποννησιακό πόλεμο;', a:['Αθήνα και Σπάρτη','Ρώμη και Καρχηδόνα','Μακεδονία και Περσία'], correct:0, difficulty:1},
    {topic:'Μέγας Αλέξανδρος', chapter:7, q:'Τι πέτυχε ο Αλέξανδρος;', a:['Κατέκτησε μεγάλο μέρος της Ανατολής','Ίδρυσε τη Ρωμαϊκή αυτοκρατορία','Ανακάλυψε τη φωτιά'], correct:0, difficulty:1},
    {topic:'Ελληνιστικά χρόνια', chapter:8, q:'Τι χαρακτηρίζει τον ελληνιστικό κόσμο;', a:['Συνάντηση ελληνικού και ανατολικών πολιτισμών','Η Παλαιολιθική τέχνη','Η διάλυση κάθε πόλης'], correct:0, difficulty:2},
    {topic:'Ρώμη', chapter:9, q:'Πώς μεγάλωσε η δύναμη της Ρώμης;', a:['Με στρατό, συμμαχίες και κατακτήσεις','Μόνο με γεωργία','Με σπηλαιογραφίες'], correct:0, difficulty:2},
    {topic:'Pax Romana', chapter:10, q:'Τι σημαίνει Pax Romana;', a:['Ρωμαϊκή ειρήνη και σταθερότητα','Αθηναϊκή δημοκρατία','Νεολιθικός οικισμός'], correct:0, difficulty:1}
  ];
  function getWeakTopics(){
    const p = window.IstoriaStorage ? IstoriaStorage.load() : {};
    return Object.keys((p && p.weakTopics) || {}).sort(function(a,b){return (p.weakTopics[b]||0)-(p.weakTopics[a]||0);});
  }
  function buildQuiz(count){
    count = count || 5;
    const weak = getWeakTopics();
    let pool = BANK.slice();
    if(weak.length){
      pool.sort(function(a,b){return (weak.includes(b.topic)?1:0) - (weak.includes(a.topic)?1:0);});
    }
    return pool.slice(0,count);
  }
  function recordAnswer(item, chosen){
    const ok = chosen === item.correct;
    if(window.IstoriaAdaptive && typeof IstoriaAdaptive.recordQuizAnswer === 'function'){
      IstoriaAdaptive.recordQuizAnswer({topic:item.topic, chapter:item.chapter, correct:ok});
    }else if(window.IstoriaStorage){
      IstoriaStorage.update(function(p){
        p.history = p.history || [];
        p.weakTopics = p.weakTopics || {};
        p.history.push({type:'dynamicQuiz', topic:item.topic, chapter:item.chapter, correct:ok, at:new Date().toISOString()});
        if(!ok) p.weakTopics[item.topic] = (p.weakTopics[item.topic]||0)+1;
      });
    }
    return ok;
  }
  window.IstoriaDynamicQuiz = {bank:BANK, buildQuiz:buildQuiz, recordAnswer:recordAnswer};
})();
