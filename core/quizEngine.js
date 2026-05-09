/* Istoria V10 Quiz Engine - shared chapter quiz rendering/grading */
(function(){
  function shuffleChoices(options){
    return options.map(function(opt, i){ return {text: opt, originalIndex: i}; })
      .sort(function(){ return Math.random() - 0.5; });
  }
  function renderQuiz(){
    const area = document.getElementById('quizArea');
    const questions = window.questions || [];
    if(!area) return;
    area.innerHTML = '';
    questions.forEach(function(item, index){
      const div = document.createElement('div');
      div.className = 'quiz-card';
      div.innerHTML = '<h3>'+(index+1)+'. '+item.q+'</h3>';
      shuffleChoices(item.options).forEach(function(choice){
        div.innerHTML += '<label style="display:block;font-size:22px;margin:10px 0;"><input type="radio" name="q'+index+'" value="'+choice.originalIndex+'"> '+choice.text+'</label>';
      });
      area.appendChild(div);
    });
  }
  function gradeQuiz(){
    const questions = window.questions || [];
    let score = 0;
    const answers = [];
    questions.forEach(function(item, index){
      const chosen = document.querySelector('input[name="q'+index+'"]:checked');
      answers[index] = chosen ? Number(chosen.value) : null;
      if(chosen && Number(chosen.value) === item.a) score++;
    });
    const box = document.getElementById('scoreBox');
    if(box){ box.className = 'score'; box.textContent = 'Σκορ: ' + score + ' / ' + questions.length; }
    if(window.playUISound) playUISound(score >= Math.ceil(questions.length*0.7) ? 'success' : 'error');
    if(window.IstoriaAdaptive) IstoriaAdaptive.recordQuizAttempt({score:score,total:questions.length,questions:questions,answers:answers});
    if(window.saveChapterProgress) saveChapterProgress({score:score,total:questions.length,bestScore:Math.round((score/questions.length)*100)});
  }
  function resetReview(){
    renderQuiz();
    const box = document.getElementById('scoreBox');
    if(box){ box.className = ''; box.textContent = ''; }
  }
  window.shuffleChoices = shuffleChoices;
  window.renderQuiz = renderQuiz;
  window.gradeQuiz = gradeQuiz;
  window.resetReview = resetReview;
  window.IstoriaQuiz = {shuffleChoices:shuffleChoices, render:renderQuiz, grade:gradeQuiz, reset:resetReview};
})();
