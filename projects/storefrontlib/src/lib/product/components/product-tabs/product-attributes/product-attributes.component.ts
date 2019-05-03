import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UIProduct } from '@spartacus/core';
import { CurrentProductService } from 'projects/storefrontlib/src/lib/ui/pages/product-page/current-product.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'cx-product-attributes',
  templateUrl: './product-attributes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductAttributesComponent implements OnInit {
  product$: Observable<UIProduct>;

  constructor(protected currentProductService: CurrentProductService) {}

  ngOnInit() {
    this.product$ = this.currentProductService.getProduct();
  }
}
