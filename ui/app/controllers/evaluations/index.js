import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { matchesState, useMachine } from 'ember-statecharts';
import { use } from 'ember-usable';
import evaluationsMachine from '../../machines/evaluations';

export default class EvaluationsController extends Controller {
  @service userSettings;
  @service store;

  @matchesState({ sidebar: { open: 'success' } })
  isSideBarOpen;

  @use statechart = useMachine(evaluationsMachine).withConfig({
    services: {
      loadEvaluation: this.loadEvaluation,
    },
    action: {
      updateQueryParameters: this.updateQueryParameters,
    },
  });

  @action
  async loadEvaluation(context, { evaluation }) {
    // set query parameters
    // open modal, set evaluationID
    return this.store.findRecord('evaluation', evaluation.id, { reload: true });
  }

  @action
  closeSidebar() {
    return this.statechart.send('MODAL_CLOSE');
  }

  @action
  async handleEvaluationClick(evaluation, event) {
    this.statechart.send('MODAL_OPEN', { evaluation });
    event.stopPropagation();
  }

  queryParams = ['nextToken', 'pageSize', 'status'];

  get shouldDisableNext() {
    return !this.model.meta?.nextToken;
  }

  get shouldDisablePrev() {
    return !this.previousTokens.length;
  }

  get optionsEvaluationsStatus() {
    return [
      { key: null, label: 'All' },
      { key: 'blocked', label: 'Blocked' },
      { key: 'pending', label: 'Pending' },
      { key: 'complete', label: 'Complete' },
      { key: 'failed', label: 'Failed' },
      { key: 'canceled', label: 'Canceled' },
    ];
  }

  @tracked pageSize = this.userSettings.pageSize;
  @tracked nextToken = null;
  @tracked previousTokens = [];
  @tracked status = null;
  @tracked isShown = false;

  @action
  onChange(newPageSize) {
    this.pageSize = newPageSize;
  }

  @action
  onNext(nextToken) {
    this.previousTokens = [...this.previousTokens, this.nextToken];
    this.nextToken = nextToken;
  }

  @action
  onPrev() {
    const lastToken = this.previousTokens.pop();
    this.previousTokens = [...this.previousTokens];
    this.nextToken = lastToken;
  }

  @action
  refresh() {
    this._resetTokens();
    this.status = null;
    this.pageSize = this.userSettings.pageSize;
  }

  @action
  setStatus(selection) {
    this._resetTokens();
    this.status = selection;
  }

  _resetTokens() {
    this.nextToken = null;
    this.previousTokens = [];
  }
}
