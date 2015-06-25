describe('ngDialog', function () {
  var any = jasmine.any,
      spy = jasmine.createSpy;

  beforeEach(module('ngDialog'));

  afterEach(inject(function (ngDialog, $document) {
    ngDialog.closeAll();
    [].slice.call(
      $document.find('body').children()
    )
    .map(angular.element)
    .forEach(function (elm) {
      if (elm.hasClass('ngdialog')) {
        // yuck
        elm.triggerHandler('animationend');
      }
    });
  }));

  it('should inject the ngDialog service', inject(function(ngDialog) {
    expect(ngDialog).toBeDefined();
  }));

  describe('no options', function () {
    var inst, elm;
    beforeEach(inject(function (ngDialog, $document, $timeout) {
      inst = ngDialog.open();
      $timeout.flush();
      elm = $document[0].getElementById(inst.id);
    }));

    it('should have returned a dialog instance object', function() {
      expect(inst).toBeDefined();
    });

    it('should include a document id', function() {
      expect(inst.id).toEqual('ngdialog1');
    });

    it('should have created an element on the DOM', function() {
      expect(elm).toBeDefined();
    });

    it('should have an empty template', function() {
      expect(elm.textContent).toEqual('Empty template');
    });
  });

  describe('with a plain template', function () {
    var elm;
    beforeEach(inject(function (ngDialog, $timeout, $document) {
      var id = ngDialog.open({
        template: '<div><p>some text {{1 + 1}}</p></div>',
        plain: true
      }).id;
      $timeout.flush();
      elm = $document[0].getElementById(id);
    }));

    it('should have compiled the html', inject(function () {
      expect(elm.textContent).toEqual('some text 2');
    }));
  });

  describe('with a plain template URL', function () {
    var elm;
    beforeEach(inject(function (ngDialog, $timeout, $document, $httpBackend) {
      $httpBackend.whenGET('test.html').respond('<div><p>some text {{1 + 1}}</p></div>');
      var id = ngDialog.open({
        templateUrl: 'test.html'
      }).id;
      $httpBackend.flush();
      $timeout.flush();
      elm = $document[0].getElementById(id);
    }));

    it('should have compiled the html', inject(function () {
      expect(elm.textContent).toEqual('some text 2');
    }));
  });

  describe('with already cached template URL', function () {
    var elm;
    beforeEach(inject(function (ngDialog, $timeout, $document, $httpBackend, $compile, $rootScope) {
      $httpBackend.whenGET('cached.html').respond('<div><p>some text {{1 + 1}}</p></div>');
      $compile('<div><div ng-include src="\'cached.html\'"></div></div>')($rootScope);

      $rootScope.$digest();
      $httpBackend.flush();

      var id = ngDialog.open({
        templateUrl: 'cached.html'
      }).id;

      $timeout.flush();

      elm = $document[0].getElementById(id);
    }));

    it('should have compiled the html', inject(function () {
      expect(elm.textContent).toEqual('some text 2');
    }));
  });

  describe('using multiple panes', function() {
    var elm;
    var scope;

    beforeEach(inject(function (ngDialog, $timeout, $document, $httpBackend) {
      $httpBackend.whenGET('main.html').respond('<div><p>main template: {{1 + 0}}</p></div>');
      $httpBackend.whenGET('pane02.html').respond('<div><p>pane: {{1 + 1}}</p></div>');
      $httpBackend.whenGET('pane03.html').respond('<div><p>pane: {{1 + 2}}</p></div>');

      var id = ngDialog.open({
        templateUrl: 'main.html',
        panes      : {
          'pane02': 'pane02.html',
          'pane03': 'pane03.html'
        }
      }).id;

      $httpBackend.flush();
      $timeout.flush();

      elm = $document[0].getElementById(id);
      scope = angular.element(elm).scope();
    }));

    it('should have compiled the main template', inject(function () {
      expect(elm.textContent).toEqual('main template: 1');
    }));

    it('should not transition if there is no pane identifier specified', inject(function ($httpBackend, $timeout) {
      scope.loadPane();
      expect(elm.textContent).toEqual('main template: 1');
    }));

    it('should not transition if there is not a valid pane template', inject(function ($httpBackend, $timeout) {
      scope.loadPane('badPane');
      expect(elm.textContent).toEqual('main template: 1');
    }));

    it('should transition to the second pane', inject(function ($httpBackend, $timeout) {
      scope.loadPane('pane02');

      $httpBackend.flush();
      $timeout.flush();

      expect(elm.textContent).toEqual('pane: 2');
    }));

    it('should transition to the third pane', inject(function ($httpBackend, $timeout) {
      scope.loadPane('pane03');

      $httpBackend.flush();
      $timeout.flush();

      expect(elm.textContent).toEqual('pane: 3');
    }));
  });

  describe('controller instantiation', function () {
    var Ctrl;
    beforeEach(inject(function (ngDialog, $timeout, $q) {
      Ctrl = spy('DialogCtrl');
      Ctrl.$inject = ['$scope', '$element', '$log', 'myLocal', 'localPromise'];
      ngDialog.open({
        controller: Ctrl,
        resolve: {
          myLocal: function () {
            return 'local';
          },
          localPromise: function () {
            return $q.when('async local!');
          }
        }
      });
      $timeout.flush();
    }));

    it('should have instantiated the controller', function() {
      expect(Ctrl).toHaveBeenCalled();
    });

    describe('dependencies', function () {
      var injected;
      beforeEach(function () {
        injected = Ctrl.calls.mostRecent().args;
      });

      it('should inject a scope', function() {
        expect(injected[0].$watch).toEqual(any(Function));
      });

      it('should inject the root dialog html element', function() {
        expect(injected[1].prop('id')).toEqual('ngdialog1');
      });

      it('should inject another angular service', inject(function($log) {
        expect(injected[2]).toBe($log);
      }));

      it('should inject a local value', function() {
        expect(injected[3]).toEqual('local');
      });

      it('should inject an asynchronous local value', function() {
        expect(injected[4]).toEqual('async local!');
      });
    });
  });

  describe('public functions checking', function () {
    var inst;
    var elm;

    beforeEach(inject(function (ngDialog, $document, $timeout) {
      inst = ngDialog.open();
      $timeout.flush();
      elm = $document[0].getElementById(inst.id);
    }));

    it('should be able to check if a dialog is open', inject(function(ngDialog) {
        expect(ngDialog.isOpen(inst.id)).toBe(true);
    }));

  });
});
